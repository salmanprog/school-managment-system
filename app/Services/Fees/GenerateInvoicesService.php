<?php

namespace App\Services\Fees;

use App\Models\FeeCategory;
use App\Models\FeeInvoice;
use App\Models\FeeInvoiceItem;
use App\Models\FeeStructure;
use App\Models\StudentEnrollment;
use App\Models\StudentFeeDiscount;
use App\Support\FeeNumberGenerator;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class GenerateInvoicesService
{
    /**
     * @return array{created: int, skipped: int, invoices: Collection<int, FeeInvoice>}
     */
    public function generate(
        int $academicSessionId,
        int $classId,
        string $billingPeriod,
        string $invoiceDate,
        string $dueDate,
        ?array $categoryIds = null,
    ): array {
        $billingPeriod = trim($billingPeriod);
        if ($billingPeriod === '') {
            throw new InvalidArgumentException('Billing period is required.');
        }

        $structures = FeeStructure::query()
            ->with('feeCategory:id,name,code,recurrence_type,status')
            ->where('academic_session_id', $academicSessionId)
            ->where('class_id', $classId)
            ->where('status', 'active')
            ->where('effective_from', '<=', $invoiceDate)
            ->when($categoryIds !== null && $categoryIds !== [], fn ($q) => $q->whereIn('fee_category_id', $categoryIds))
            ->get()
            ->filter(fn (FeeStructure $s) => $s->feeCategory && $s->feeCategory->status === 'active');

        if ($structures->isEmpty()) {
            throw new InvalidArgumentException('No active fee structures found for the selected class and session.');
        }

        $enrollments = StudentEnrollment::query()
            ->with(['student:id,first_name,last_name', 'section:id,class_id'])
            ->where('academic_session_id', $academicSessionId)
            ->where('status', 'active')
            ->whereHas('section', fn ($q) => $q->where('class_id', $classId))
            ->get();

        if ($enrollments->isEmpty()) {
            throw new InvalidArgumentException('No active enrollments found for the selected class and session.');
        }

        $created = collect();
        $skipped = 0;

        DB::transaction(function () use (
            $enrollments,
            $structures,
            $billingPeriod,
            $invoiceDate,
            $dueDate,
            &$created,
            &$skipped,
        ) {
            foreach ($enrollments as $enrollment) {
                $lineItems = [];

                foreach ($structures as $structure) {
                    $category = $structure->feeCategory;
                    if (! $this->categoryMatchesBillingPeriod($category->recurrence_type, $billingPeriod)) {
                        continue;
                    }

                    if ($this->alreadyBilled($enrollment->id, $billingPeriod, $category->id)) {
                        $skipped++;

                        continue;
                    }

                    $amount = round((float) $structure->amount, 2);
                    $discount = round($this->discountForEnrollment($enrollment->id, $invoiceDate, $amount), 2);
                    $net = round(max(0, $amount - $discount), 2);

                    $lineItems[] = [
                        'fee_category_id' => $category->id,
                        'description' => $category->name,
                        'amount' => $amount,
                        'discount_amount' => $discount,
                        'net_amount' => $net,
                    ];
                }

                if ($lineItems === []) {
                    continue;
                }

                $subtotal = round(collect($lineItems)->sum('amount'), 2);
                $discountTotal = round(collect($lineItems)->sum('discount_amount'), 2);
                $total = round(collect($lineItems)->sum('net_amount'), 2);

                $invoice = FeeInvoice::query()->create([
                    'invoice_number' => FeeNumberGenerator::nextInvoiceNumber(),
                    'student_enrollment_id' => $enrollment->id,
                    'billing_period' => $billingPeriod,
                    'invoice_date' => $invoiceDate,
                    'due_date' => $dueDate,
                    'subtotal' => $subtotal,
                    'discount_total' => $discountTotal,
                    'total_amount' => $total,
                    'status' => 'unpaid',
                ]);

                foreach ($lineItems as $item) {
                    FeeInvoiceItem::query()->create([
                        'fee_invoice_id' => $invoice->id,
                        ...$item,
                    ]);
                }

                $created->push($invoice);
            }
        });

        return [
            'created' => $created->count(),
            'skipped' => $skipped,
            'invoices' => $created,
        ];
    }

    protected function categoryMatchesBillingPeriod(string $recurrenceType, string $billingPeriod): bool
    {
        if ($recurrenceType === 'monthly') {
            return (bool) preg_match('/^\d{4}-\d{2}$/', $billingPeriod);
        }

        return $recurrenceType === 'one_time';
    }

    protected function alreadyBilled(int $enrollmentId, string $billingPeriod, int $categoryId): bool
    {
        return FeeInvoiceItem::query()
            ->where('fee_category_id', $categoryId)
            ->whereHas('feeInvoice', function ($q) use ($enrollmentId, $billingPeriod) {
                $q->where('student_enrollment_id', $enrollmentId)
                    ->where('billing_period', $billingPeriod);
            })
            ->exists();
    }

    protected function discountForEnrollment(int $enrollmentId, string $asOfDate, float $lineAmount): float
    {
        $date = Carbon::parse($asOfDate);

        $assignments = StudentFeeDiscount::query()
            ->with('feeDiscount:id,discount_type,value,status')
            ->where('student_enrollment_id', $enrollmentId)
            ->where('effective_from', '<=', $date)
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', $date);
            })
            ->get()
            ->filter(fn (StudentFeeDiscount $row) => $row->feeDiscount && $row->feeDiscount->status === 'active');

        $discount = 0.0;
        foreach ($assignments as $assignment) {
            $def = $assignment->feeDiscount;
            if ($def->discount_type === 'percentage') {
                $discount += $lineAmount * ((float) $def->value / 100);
            } else {
                $discount += (float) $def->value;
            }
        }

        return min($discount, $lineAmount);
    }
}
