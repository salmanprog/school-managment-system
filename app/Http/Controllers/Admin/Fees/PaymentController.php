<?php

namespace App\Http\Controllers\Admin\Fees;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Fees\CollectPaymentRequest;
use App\Models\AcademicSession;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Services\Fees\CollectPaymentService;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class PaymentController extends Controller
{
    public function __construct(
        protected CollectPaymentService $collectPaymentService,
    ) {}

    public function collectForm(Request $request): Response
    {
        $sessionId = $request->integer('session_id')
            ?: AcademicSession::query()->where('is_current', true)->value('id');
        $classId = $request->integer('class_id') ?: null;
        $studentId = $request->integer('student_id') ?: null;

        $studentOptions = collect();
        if ($sessionId && $classId) {
            $studentOptions = Student::query()
                ->where('status', 'active')
                ->whereHas('enrollments', function ($enrollment) use ($sessionId, $classId) {
                    $enrollment
                        ->where('academic_session_id', $sessionId)
                        ->whereIn('status', ['active', 'promoted', 'repeated'])
                        ->whereHas('section', fn ($s) => $s->where('class_id', $classId));
                })
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(['id', 'first_name', 'last_name', 'admission_number'])
                ->map(fn (Student $s) => [
                    'id' => $s->id,
                    'label' => trim("{$s->admission_number} — {$s->first_name} {$s->last_name}"),
                ])
                ->values();

            // Drop student selection if they are not in the chosen class roster.
            if ($studentId && ! $studentOptions->contains(fn ($row) => (int) $row['id'] === $studentId)) {
                $studentId = null;
            }
        } else {
            $studentId = null;
        }

        $classFeeAmount = 0.0;
        if ($sessionId && $classId) {
            $classFeeAmount = round((float) FeeStructure::query()
                ->where('academic_session_id', $sessionId)
                ->where('class_id', $classId)
                ->where('status', 'active')
                ->where('effective_from', '<=', now()->toDateString())
                ->whereHas('feeCategory', fn ($q) => $q->where('status', 'active'))
                ->sum('amount'), 2);
        }

        $pendingInvoices = collect();
        $paidMonths = [];
        if ($studentId) {
            $pendingInvoices = FeeInvoice::query()
                ->with('studentEnrollment:id,student_id')
                ->whereIn('status', ['unpaid', 'partially_paid', 'overdue'])
                ->whereHas('studentEnrollment', fn ($q) => $q->where('student_id', $studentId))
                ->orderBy('due_date')
                ->get()
                ->map(function (FeeInvoice $invoice) {
                    $invoice->loadSum('paymentAllocations as paid_total', 'allocated_amount');
                    $balance = max(0, round((float) $invoice->total_amount - (float) ($invoice->paid_total ?? 0), 2));

                    return [
                        'id' => $invoice->id,
                        'invoice_number' => $invoice->invoice_number,
                        'due_date' => $invoice->due_date?->format('Y-m-d'),
                        'total_amount' => (float) $invoice->total_amount,
                        'balance_due' => $balance,
                        'status' => $invoice->status,
                    ];
                })
                ->filter(fn ($row) => $row['balance_due'] > 0)
                ->values();

            $paidMonths = FeePayment::query()
                ->where('student_id', $studentId)
                ->where('status', 'completed')
                ->orderByDesc('payment_date')
                ->get(['payment_number', 'payment_date', 'amount'])
                ->map(fn (FeePayment $payment) => [
                    'year_month' => $payment->payment_date?->format('Y-m'),
                    'month_label' => $payment->payment_date?->format('F Y'),
                    'payment_number' => $payment->payment_number,
                    'payment_date' => $payment->payment_date?->format('Y-m-d'),
                    'amount' => (float) $payment->amount,
                ])
                ->filter(fn ($row) => filled($row['year_month']))
                ->unique('year_month')
                ->values()
                ->all();
        }

        return Inertia::render('Admin/Fees/Payments/Collect', [
            'classOptions' => SchoolClass::query()
                ->where('status', EntityStatus::Active->value)
                ->orderBy('sort_order')
                ->get(['id', 'name', 'code']),
            'studentOptions' => $studentOptions,
            'pendingInvoices' => $pendingInvoices,
            'paidMonths' => $paidMonths,
            'classFeeAmount' => $classFeeAmount,
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'class_id' => $classId ? (string) $classId : '',
                'student_id' => $studentId ? (string) $studentId : '',
            ],
            'paymentMethods' => ['cash', 'bank_transfer', 'card', 'online'],
        ]);
    }

    public function collectStore(CollectPaymentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $payment = $this->collectPaymentService->collect(
                (int) $data['student_id'],
                (float) $data['amount'],
                $data['payment_date'],
                $data['payment_method'],
                $data['transaction_reference'] ?? null,
                (int) Auth::id(),
                $data['allocations'] ?? [],
            );
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['collect' => $e->getMessage()])->withInput();
        }

        return redirect()
            ->route('admin.fees.collect')
            ->with('success', "Payment {$payment->payment_number} recorded.")
            ->with('print_receipt_id', $payment->id);
    }

    public function pending(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $search = $request->string('search')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $invoices = FeeInvoice::query()
            ->with([
                'studentEnrollment.student:id,first_name,last_name,admission_number',
                'studentEnrollment.section.schoolClass:id,name',
            ])
            ->whereIn('status', ['unpaid', 'partially_paid'])
            ->when($sessionId, fn ($q) => $q->whereHas('studentEnrollment', fn ($e) => $e->where('academic_session_id', $sessionId)))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('studentEnrollment.student', function ($s) use ($search) {
                            $s->where('admission_number', 'like', "%{$search}%")
                                ->orWhere('first_name', 'like', "%{$search}%")
                                ->orWhere('last_name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('due_date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (FeeInvoice $invoice) {
                $invoice->loadSum('paymentAllocations as paid_total', 'allocated_amount');
                $student = $invoice->studentEnrollment?->student;
                $balance = max(0, round((float) $invoice->total_amount - (float) ($invoice->paid_total ?? 0), 2));

                return [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'due_date' => $invoice->due_date?->format('Y-m-d'),
                    'status' => $invoice->status,
                    'total_amount' => (float) $invoice->total_amount,
                    'balance_due' => $balance,
                    'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : null,
                    'admission_number' => $student?->admission_number,
                    'class_name' => $invoice->studentEnrollment?->section?->schoolClass?->name,
                ];
            });

        return Inertia::render('Admin/Fees/Payments/Pending', [
            'invoices' => $invoices,
            'sessionOptions' => AcademicSession::query()->orderByDesc('start_date')->get(['id', 'name']),
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'search' => $search,
                'per_page' => (string) $perPage,
            ],
        ]);
    }

    public function receipts(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $classId = $request->integer('class_id') ?: null;
        $month = $request->integer('month') ?: (int) now()->month;
        $year = $request->integer('year') ?: (int) now()->year;
        $sessionId = AcademicSession::query()->where('is_current', true)->value('id');
        $perPage = ListQuery::perPage($request);

        if ($month < 1 || $month > 12) {
            $month = (int) now()->month;
        }

        $students = collect();
        $summary = ['total' => 0, 'paid' => 0, 'unpaid' => 0];

        if ($classId && $sessionId) {
            $paymentsByStudent = FeePayment::query()
                ->where('status', 'completed')
                ->whereYear('payment_date', $year)
                ->whereMonth('payment_date', $month)
                ->whereHas('student.enrollments', function ($enrollment) use ($classId, $sessionId) {
                    $enrollment
                        ->where('academic_session_id', $sessionId)
                        ->whereIn('status', ['active', 'promoted', 'repeated'])
                        ->whereHas('section', fn ($section) => $section->where('class_id', $classId));
                })
                ->orderByDesc('payment_date')
                ->orderByDesc('id')
                ->get(['id', 'student_id', 'payment_number', 'payment_date', 'amount', 'payment_method'])
                ->groupBy('student_id');

            $students = Student::query()
                ->where('status', 'active')
                ->whereHas('enrollments', function ($enrollment) use ($sessionId, $classId) {
                    $enrollment
                        ->where('academic_session_id', $sessionId)
                        ->whereIn('status', ['active', 'promoted', 'repeated'])
                        ->whereHas('section', fn ($section) => $section->where('class_id', $classId));
                })
                ->when($search !== '', function ($q) use ($search) {
                    $q->where(function ($inner) use ($search) {
                        $inner->where('admission_number', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
                })
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->paginate($perPage)
                ->withQueryString()
                ->through(function (Student $student) use ($paymentsByStudent) {
                    $payment = $paymentsByStudent->get($student->id)?->first();

                    return [
                        'id' => $student->id,
                        'student_name' => trim("{$student->first_name} {$student->last_name}"),
                        'admission_number' => $student->admission_number,
                        'paid' => $payment !== null,
                        'payment_id' => $payment?->id,
                        'payment_number' => $payment?->payment_number,
                        'payment_date' => $payment?->payment_date?->format('Y-m-d'),
                        'amount' => $payment ? (float) $payment->amount : null,
                        'payment_method' => $payment?->payment_method,
                    ];
                });

            $allStudentIds = Student::query()
                ->where('status', 'active')
                ->whereHas('enrollments', function ($enrollment) use ($sessionId, $classId) {
                    $enrollment
                        ->where('academic_session_id', $sessionId)
                        ->whereIn('status', ['active', 'promoted', 'repeated'])
                        ->whereHas('section', fn ($section) => $section->where('class_id', $classId));
                })
                ->pluck('id');

            $paidCount = $allStudentIds
                ->filter(fn ($id) => $paymentsByStudent->has($id))
                ->count();

            $summary = [
                'total' => $allStudentIds->count(),
                'paid' => $paidCount,
                'unpaid' => $allStudentIds->count() - $paidCount,
            ];
        }

        $yearOptions = collect(range((int) now()->year - 2, (int) now()->year + 1))
            ->reverse()
            ->values();

        return Inertia::render('Admin/Fees/Payments/Receipts', [
            'students' => $students,
            'summary' => $summary,
            'classSelected' => (bool) $classId,
            'classOptions' => SchoolClass::query()
                ->where('status', EntityStatus::Active->value)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name']),
            'monthOptions' => collect(range(1, 12))->map(fn (int $m) => [
                'value' => $m,
                'label' => \Carbon\Carbon::create(null, $m, 1)->format('F'),
            ])->values(),
            'yearOptions' => $yearOptions,
            'filters' => [
                'search' => $search,
                'class_id' => $classId ? (string) $classId : '',
                'month' => (string) $month,
                'year' => (string) $year,
                'per_page' => (string) $perPage,
            ],
        ]);
    }

    public function receiptPrint(FeePayment $feePayment): HttpResponse
    {
        $feePayment->load([
            'student.enrollments' => fn ($q) => $q
                ->with(['section.schoolClass:id,name'])
                ->whereIn('status', ['active', 'promoted', 'repeated'])
                ->orderByDesc('id'),
            'receivedByUser:id,name',
            'allocations.feeInvoice.items.feeCategory',
        ]);

        $className = $feePayment->student?->enrollments
            ?->first()
            ?->section
            ?->schoolClass
            ?->name;

        return response()->view('fees.pos-receipt', [
            'payment' => $feePayment,
            'school' => SchoolSetting::query()->first(),
            'className' => $className,
        ]);
    }
}
