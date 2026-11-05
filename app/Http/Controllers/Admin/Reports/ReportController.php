<?php

namespace App\Http\Controllers\Admin\Reports;

use App\Exports\ArrayExport;
use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Support\AttendanceScore;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function students(Request $request): Response|BinaryFileResponse
    {
        $filters = $this->studentFilters($request);
        $rows = $this->studentRows($filters);

        if ($request->boolean('export')) {
            return $this->download(
                'student-report',
                ['Admission #', 'Student', 'Class', 'Section', 'Roll #', 'Status', 'Guardian', 'Phone'],
                collect($rows)->map(fn ($r) => [
                    $r['admission_number'],
                    $r['full_name'],
                    $r['class_name'],
                    $r['section_name'],
                    $r['roll_number'],
                    $r['status'],
                    $r['guardian_name'],
                    $r['guardian_phone'],
                ])->all()
            );
        }

        return Inertia::render('Admin/Reports/Students', [
            'rows' => $rows,
            'filters' => $filters,
            'filterOptions' => $this->filterOptions(),
            'summary' => ['total' => count($rows)],
        ]);
    }

    public function attendance(Request $request): Response|BinaryFileResponse
    {
        $filters = $this->attendanceFilters($request);
        $rows = $this->attendanceRows($filters);

        if ($request->boolean('export')) {
            return $this->download(
                'attendance-report',
                ['Date', 'Class', 'Section', 'Marked', 'Present %'],
                collect($rows)->map(fn ($r) => [
                    $r['date'],
                    $r['class_name'],
                    $r['section_name'],
                    $r['marked'],
                    $r['present_pct'],
                ])->all()
            );
        }

        return Inertia::render('Admin/Reports/Attendance', [
            'rows' => $rows,
            'filters' => $filters,
            'filterOptions' => $this->filterOptions(),
        ]);
    }

    public function feeCollection(Request $request): Response|BinaryFileResponse
    {
        $filters = $this->feeCollectionFilters($request);
        $rows = $this->feeCollectionRows($filters);

        if ($request->boolean('export')) {
            return $this->download(
                'fee-collection-report',
                ['Payment #', 'Date', 'Student', 'Amount', 'Method', 'Received by'],
                collect($rows)->map(fn ($r) => [
                    $r['payment_number'],
                    $r['payment_date'],
                    $r['student_name'],
                    $r['amount'],
                    $r['payment_method'],
                    $r['received_by'],
                ])->all()
            );
        }

        $total = collect($rows)->sum(fn ($r) => (float) $r['amount_raw']);

        return Inertia::render('Admin/Reports/FeeCollection', [
            'rows' => $rows,
            'filters' => $filters,
            'summary' => ['total' => number_format($total, 2)],
        ]);
    }

    public function outstandingFees(Request $request): Response|BinaryFileResponse
    {
        $filters = $this->outstandingFilters($request);
        $rows = $this->outstandingRows($filters);

        if ($request->boolean('export')) {
            return $this->download(
                'outstanding-fees-report',
                ['Invoice #', 'Student', 'Class', 'Due date', 'Total', 'Paid', 'Balance', 'Status'],
                collect($rows)->map(fn ($r) => [
                    $r['invoice_number'],
                    $r['student_name'],
                    $r['class_name'],
                    $r['due_date'],
                    $r['total_amount'],
                    $r['paid_amount'],
                    $r['balance'],
                    $r['status'],
                ])->all()
            );
        }

        $balanceTotal = collect($rows)->sum(fn ($r) => (float) $r['balance_raw']);

        return Inertia::render('Admin/Reports/OutstandingFees', [
            'rows' => $rows,
            'filters' => $filters,
            'filterOptions' => $this->filterOptions(),
            'summary' => ['total_balance' => number_format($balanceTotal, 2)],
        ]);
    }

    public function examinations(Request $request): Response|BinaryFileResponse
    {
        $filters = $this->examinationFilters($request);
        $rows = $this->examinationRows($filters);

        if ($request->boolean('export')) {
            return $this->download(
                'examination-report',
                ['Exam', 'Student', 'Class', 'Section', 'Percentage', 'Grade', 'Published'],
                collect($rows)->map(fn ($r) => [
                    $r['exam_name'],
                    $r['student_name'],
                    $r['class_name'],
                    $r['section_name'],
                    $r['percentage'],
                    $r['grade'],
                    $r['published_at'],
                ])->all()
            );
        }

        return Inertia::render('Admin/Reports/Examinations', [
            'rows' => $rows,
            'filters' => $filters,
            'filterOptions' => $this->filterOptions(),
            'examOptions' => Exam::query()
                ->when($filters['session_id'], fn ($q) => $q->where('academic_session_id', $filters['session_id']))
                ->orderByDesc('start_date')
                ->get(['id', 'name']),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function studentFilters(Request $request): array
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');

        return [
            'search' => $request->string('search')->trim()->toString(),
            'status' => $request->string('status')->trim()->toString(),
            'session_id' => $sessionId,
            'class_id' => $request->integer('class_id') ?: null,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    protected function studentRows(array $filters): array
    {
        $query = Student::query()
            ->with(['guardians' => fn ($q) => $q->wherePivot('is_primary', true)->limit(1)])
            ->when($filters['status'] !== '', fn ($q) => $q->where('status', $filters['status']))
            ->when($filters['search'] !== '', function ($q) use ($filters) {
                $search = $filters['search'];
                $q->where(function ($inner) use ($search) {
                    $inner->where('admission_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($filters['session_id'] || $filters['class_id'], function ($q) use ($filters) {
                $q->whereHas('enrollments', function ($enrollment) use ($filters) {
                    if ($filters['session_id']) {
                        $enrollment->where('academic_session_id', $filters['session_id'])->where('status', 'active');
                    }
                    if ($filters['class_id']) {
                        $enrollment->whereHas('section', fn ($s) => $s->where('class_id', $filters['class_id']));
                    }
                });
            })
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->limit(500)
            ->get();

        $enrollments = StudentEnrollment::query()
            ->with(['section.schoolClass'])
            ->whereIn('student_id', $query->pluck('id'))
            ->when($filters['session_id'], fn ($q) => $q->where('academic_session_id', $filters['session_id']))
            ->where('status', 'active')
            ->get()
            ->keyBy('student_id');

        return $query->map(function (Student $student) use ($enrollments) {
            $enrollment = $enrollments->get($student->id);
            $guardian = $student->guardians->first();

            return [
                'admission_number' => $student->admission_number,
                'full_name' => trim("{$student->first_name} {$student->last_name}"),
                'class_name' => $enrollment?->section?->schoolClass?->name ?? '—',
                'section_name' => $enrollment?->section?->name ?? '—',
                'roll_number' => $enrollment?->roll_number ?? '—',
                'status' => $student->status,
                'guardian_name' => $guardian?->full_name ?? '—',
                'guardian_phone' => $guardian?->phone ?? '—',
            ];
        })->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function attendanceFilters(Request $request): array
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');

        return [
            'session_id' => $sessionId,
            'class_id' => $request->integer('class_id') ?: null,
            'date_from' => $request->string('date_from')->toString() ?: Carbon::now()->subDays(30)->toDateString(),
            'date_to' => $request->string('date_to')->toString() ?: Carbon::today()->toDateString(),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    protected function attendanceRows(array $filters): array
    {
        $records = StudentAttendance::query()
            ->whereBetween('attendance_date', [$filters['date_from'], $filters['date_to']])
            ->whereHas('studentEnrollment', function ($q) use ($filters) {
                if ($filters['session_id']) {
                    $q->where('academic_session_id', $filters['session_id']);
                }
                if ($filters['class_id']) {
                    $q->whereHas('section', fn ($s) => $s->where('class_id', $filters['class_id']));
                }
            })
            ->with(['studentEnrollment.section.schoolClass'])
            ->get()
            ->groupBy(fn ($row) => $row->attendance_date->format('Y-m-d').'|'.
                ($row->studentEnrollment?->section?->schoolClass?->name ?? '').'|'.
                ($row->studentEnrollment?->section?->name ?? ''));

        $rows = [];

        foreach ($records as $key => $group) {
            [$date, $className, $sectionName] = array_pad(explode('|', $key, 3), 3, '');
            $statuses = $group->pluck('status');
            $pct = AttendanceScore::percentageFromStatuses($statuses);

            $rows[] = [
                'date' => $date,
                'class_name' => $className ?: '—',
                'section_name' => $sectionName ?: '—',
                'marked' => $group->count(),
                'present_pct' => $pct !== null ? $pct.'%' : '—',
            ];
        }

        usort($rows, fn ($a, $b) => strcmp($b['date'], $a['date']));

        return $rows;
    }

    /**
     * @return array<string, mixed>
     */
    protected function feeCollectionFilters(Request $request): array
    {
        return [
            'date_from' => $request->string('date_from')->toString() ?: Carbon::now()->startOfMonth()->toDateString(),
            'date_to' => $request->string('date_to')->toString() ?: Carbon::today()->toDateString(),
            'payment_method' => $request->string('payment_method')->trim()->toString(),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    protected function feeCollectionRows(array $filters): array
    {
        return FeePayment::query()
            ->with(['student:id,first_name,last_name,admission_number', 'receivedByUser:id,name'])
            ->where('status', 'completed')
            ->whereBetween('payment_date', [$filters['date_from'], $filters['date_to']])
            ->when($filters['payment_method'] !== '', fn ($q) => $q->where('payment_method', $filters['payment_method']))
            ->orderByDesc('payment_date')
            ->limit(500)
            ->get()
            ->map(fn (FeePayment $payment) => [
                'payment_number' => $payment->payment_number,
                'payment_date' => $payment->payment_date?->format('Y-m-d'),
                'student_name' => trim(($payment->student?->first_name ?? '').' '.($payment->student?->last_name ?? '')),
                'amount' => number_format((float) $payment->amount, 2),
                'amount_raw' => (float) $payment->amount,
                'payment_method' => $payment->payment_method,
                'received_by' => $payment->receivedByUser?->name ?? '—',
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function outstandingFilters(Request $request): array
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');

        return [
            'session_id' => $sessionId,
            'class_id' => $request->integer('class_id') ?: null,
            'status' => $request->string('status')->trim()->toString(),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    protected function outstandingRows(array $filters): array
    {
        $invoices = FeeInvoice::query()
            ->with([
                'studentEnrollment.student:id,first_name,last_name',
                'studentEnrollment.section.schoolClass',
            ])
            ->withSum('paymentAllocations as paid_total', 'allocated_amount')
            ->when($filters['session_id'], function ($q) use ($filters) {
                $q->whereHas('studentEnrollment', fn ($e) => $e->where('academic_session_id', $filters['session_id']));
            })
            ->when($filters['class_id'], function ($q) use ($filters) {
                $q->whereHas('studentEnrollment.section', fn ($s) => $s->where('class_id', $filters['class_id']));
            })
            ->when($filters['status'] !== '', fn ($q) => $q->where('status', $filters['status']))
            ->whereIn('status', ['unpaid', 'partially_paid', 'overdue'])
            ->orderBy('due_date')
            ->limit(500)
            ->get();

        return $invoices->map(function (FeeInvoice $invoice) {
            $paid = round((float) ($invoice->paid_total ?? 0), 2);
            $total = round((float) $invoice->total_amount, 2);
            $balance = max(0, round($total - $paid, 2));
            $student = $invoice->studentEnrollment?->student;

            return [
                'invoice_number' => $invoice->invoice_number,
                'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : '—',
                'class_name' => $invoice->studentEnrollment?->section?->schoolClass?->name ?? '—',
                'due_date' => $invoice->due_date?->format('Y-m-d'),
                'total_amount' => number_format($total, 2),
                'paid_amount' => number_format($paid, 2),
                'balance' => number_format($balance, 2),
                'balance_raw' => $balance,
                'status' => $invoice->status,
            ];
        })->filter(fn ($row) => (float) $row['balance_raw'] > 0)->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function examinationFilters(Request $request): array
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');

        return [
            'session_id' => $sessionId,
            'exam_id' => $request->integer('exam_id') ?: null,
            'class_id' => $request->integer('class_id') ?: null,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<array<string, mixed>>
     */
    protected function examinationRows(array $filters): array
    {
        return ReportCard::query()
            ->with([
                'exam:id,name',
                'studentEnrollment.student:id,first_name,last_name',
                'studentEnrollment.section.schoolClass',
            ])
            ->when($filters['exam_id'], fn ($q) => $q->where('exam_id', $filters['exam_id']))
            ->when($filters['session_id'], function ($q) use ($filters) {
                $q->whereHas('studentEnrollment', fn ($e) => $e->where('academic_session_id', $filters['session_id']));
            })
            ->when($filters['class_id'], function ($q) use ($filters) {
                $q->whereHas('studentEnrollment.section', fn ($s) => $s->where('class_id', $filters['class_id']));
            })
            ->orderByDesc('percentage')
            ->limit(500)
            ->get()
            ->map(function (ReportCard $card) {
                $student = $card->studentEnrollment?->student;

                return [
                    'exam_name' => $card->exam?->name ?? '—',
                    'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : '—',
                    'class_name' => $card->studentEnrollment?->section?->schoolClass?->name ?? '—',
                    'section_name' => $card->studentEnrollment?->section?->name ?? '—',
                    'percentage' => $card->percentage !== null ? number_format((float) $card->percentage, 1).'%' : '—',
                    'grade' => $card->grade ?? '—',
                    'published_at' => $card->published_at?->format('Y-m-d') ?? '—',
                ];
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function filterOptions(): array
    {
        return [
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->where('status', 'active')->orderBy('sort_order')->get(['id', 'name']),
            'statusOptions' => ['active', 'inactive', 'graduated', 'withdrawn'],
        ];
    }

    /**
     * @param  list<string>  $headings
     * @param  list<list<string|int|float|null>>  $rows
     */
    protected function download(string $basename, array $headings, array $rows): BinaryFileResponse
    {
        $filename = $basename.'-'.now()->format('Y-m-d').'.xlsx';

        return Excel::download(new ArrayExport($headings, $rows), $filename);
    }
}
