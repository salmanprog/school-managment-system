<?php

namespace App\Services\Fees;

use App\Models\AcademicSession;
use App\Models\FeeCategory;
use App\Models\FeeInvoice;
use App\Models\FeeInvoiceItem;
use App\Models\FeePayment;
use App\Models\FeePaymentAllocation;
use App\Models\StudentEnrollment;
use App\Support\FeeNumberGenerator;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CollectPaymentService
{
    public function __construct(
        protected RecalculateInvoiceStatusService $recalculateInvoiceStatusService,
    ) {}

    /**
     * @param  array<int, array{fee_invoice_id: int, allocated_amount: float|int|string}>  $allocations
     */
    public function collect(
        int $studentId,
        float $amount,
        string $paymentDate,
        string $paymentMethod,
        ?string $transactionReference,
        int $receivedByUserId,
        array $allocations,
    ): FeePayment {
        $amount = round($amount, 2);
        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero.');
        }

        $this->assertNoPaymentForMonth($studentId, $paymentDate);

        return DB::transaction(function () use (
            $studentId,
            $amount,
            $paymentDate,
            $paymentMethod,
            $transactionReference,
            $receivedByUserId,
            $allocations,
        ) {
            // Re-check inside the transaction to avoid race duplicates.
            $this->assertNoPaymentForMonth($studentId, $paymentDate);

            if ($allocations === []) {
                $allocations = $this->autoAllocate($studentId, $amount, $paymentDate);
            }

            $allocatedTotal = 0.0;
            $lockedInvoices = [];

            foreach ($allocations as $row) {
                $invoiceId = (int) ($row['fee_invoice_id'] ?? 0);
                $allocate = round((float) ($row['allocated_amount'] ?? 0), 2);

                if ($invoiceId <= 0 || $allocate <= 0) {
                    throw new InvalidArgumentException('Each allocation must reference an invoice with a positive amount.');
                }

                $invoice = FeeInvoice::query()->lockForUpdate()->findOrFail($invoiceId);
                $lockedInvoices[$invoiceId] = $invoice;

                $invoice->loadMissing('studentEnrollment:id,student_id');

                if ($invoice->studentEnrollment?->student_id !== $studentId) {
                    throw new InvalidArgumentException('Invoice does not belong to the selected student.');
                }

                $balance = $this->invoiceBalance($invoice);
                if ($allocate > $balance + 0.001) {
                    throw new InvalidArgumentException("Allocation exceeds balance due on invoice {$invoice->invoice_number}.");
                }

                $allocatedTotal += $allocate;
            }

            if ($allocatedTotal > $amount + 0.001) {
                throw new InvalidArgumentException('Total allocated amount cannot exceed the payment amount.');
            }

            if ($allocatedTotal < $amount - 0.001) {
                throw new InvalidArgumentException('Payment amount must match the sum of invoice allocations.');
            }

            $payment = FeePayment::query()->create([
                'payment_number' => FeeNumberGenerator::nextPaymentNumber(),
                'student_id' => $studentId,
                'payment_date' => $paymentDate,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'transaction_reference' => $transactionReference,
                'received_by' => $receivedByUserId,
                'status' => 'completed',
            ]);

            foreach ($allocations as $row) {
                $invoiceId = (int) $row['fee_invoice_id'];
                $allocate = round((float) $row['allocated_amount'], 2);

                FeePaymentAllocation::query()->create([
                    'fee_payment_id' => $payment->id,
                    'fee_invoice_id' => $invoiceId,
                    'allocated_amount' => $allocate,
                ]);

                $this->recalculateInvoiceStatusService->recalculate($lockedInvoices[$invoiceId]->fresh());
            }

            return $payment->load(['allocations.feeInvoice', 'receivedByUser:id,name']);
        });
    }

    /**
     * One completed fee payment per student per calendar month.
     */
    public function assertNoPaymentForMonth(int $studentId, string $paymentDate): void
    {
        $date = Carbon::parse($paymentDate)->startOfDay();
        $monthLabel = $date->format('F Y');

        $exists = FeePayment::query()
            ->where('student_id', $studentId)
            ->where('status', 'completed')
            ->whereYear('payment_date', $date->year)
            ->whereMonth('payment_date', $date->month)
            ->exists();

        if ($exists) {
            throw new InvalidArgumentException(
                "Fee for {$monthLabel} has already been received for this student. Only one payment is allowed per month."
            );
        }
    }

    /**
     * Apply payment FIFO across unpaid invoices; create a fee line for any leftover amount.
     *
     * @return array<int, array{fee_invoice_id: int, allocated_amount: float}>
     */
    protected function autoAllocate(int $studentId, float $amount, string $paymentDate): array
    {
        $invoices = FeeInvoice::query()
            ->whereIn('status', ['unpaid', 'partially_paid', 'overdue'])
            ->whereHas('studentEnrollment', fn ($q) => $q->where('student_id', $studentId))
            ->orderBy('due_date')
            ->orderBy('id')
            ->lockForUpdate()
            ->get();

        $remaining = $amount;
        $allocations = [];

        foreach ($invoices as $invoice) {
            if ($remaining <= 0) {
                break;
            }

            $balance = $this->invoiceBalance($invoice);
            if ($balance <= 0) {
                continue;
            }

            $allocate = round(min($balance, $remaining), 2);
            if ($allocate <= 0) {
                continue;
            }

            $allocations[] = [
                'fee_invoice_id' => $invoice->id,
                'allocated_amount' => $allocate,
            ];
            $remaining = round($remaining - $allocate, 2);
        }

        if ($remaining > 0.001) {
            $invoice = $this->createCollectionInvoice($studentId, $remaining, $paymentDate);
            $allocations[] = [
                'fee_invoice_id' => $invoice->id,
                'allocated_amount' => $remaining,
            ];
        }

        if ($allocations === []) {
            throw new InvalidArgumentException('Unable to record this payment. Check the student enrollment and try again.');
        }

        return $allocations;
    }

    /**
     * Create a simple unpaid invoice so a payment can be recorded without a prior Generate step.
     */
    protected function createCollectionInvoice(int $studentId, float $amount, string $paymentDate): FeeInvoice
    {
        $enrollment = $this->resolveEnrollment($studentId);
        $category = $this->resolveCollectionCategory();
        $amount = round($amount, 2);

        $invoice = FeeInvoice::query()->create([
            'invoice_number' => FeeNumberGenerator::nextInvoiceNumber(),
            'student_enrollment_id' => $enrollment->id,
            'billing_period' => now()->format('Y-m'),
            'invoice_date' => $paymentDate,
            'due_date' => $paymentDate,
            'subtotal' => $amount,
            'discount_total' => 0,
            'total_amount' => $amount,
            'status' => 'unpaid',
        ]);

        FeeInvoiceItem::query()->create([
            'fee_invoice_id' => $invoice->id,
            'fee_category_id' => $category->id,
            'description' => 'Fee payment',
            'amount' => $amount,
            'discount_amount' => 0,
            'net_amount' => $amount,
        ]);

        return $invoice;
    }

    protected function resolveEnrollment(int $studentId): StudentEnrollment
    {
        $currentSessionId = AcademicSession::query()->where('is_current', true)->value('id');

        $enrollment = StudentEnrollment::query()
            ->where('student_id', $studentId)
            ->whereIn('status', ['active', 'promoted', 'repeated'])
            ->when(
                $currentSessionId,
                fn ($q) => $q->orderByRaw('case when academic_session_id = ? then 0 else 1 end', [$currentSessionId]),
            )
            ->orderByDesc('id')
            ->first();

        if (! $enrollment) {
            throw new InvalidArgumentException('This student has no active enrollment. Enroll them first, then collect fees.');
        }

        return $enrollment;
    }

    protected function resolveCollectionCategory(): FeeCategory
    {
        $category = FeeCategory::query()
            ->where('status', 'active')
            ->orderBy('id')
            ->first();

        if ($category) {
            return $category;
        }

        return FeeCategory::query()->create([
            'name' => 'Fee payment',
            'code' => 'FEE-PAY',
            'recurrence_type' => 'one_time',
            'status' => 'active',
        ]);
    }

    protected function invoiceBalance(FeeInvoice $invoice): float
    {
        $invoice->loadSum('paymentAllocations as paid_total', 'allocated_amount');
        $paid = round((float) ($invoice->paid_total ?? 0), 2);
        $total = round((float) $invoice->total_amount, 2);

        return max(0, round($total - $paid, 2));
    }
}
