<?php

namespace App\Http\Controllers\Admin\Attendance;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Attendance\StoreAttendanceRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Services\Attendance\RecordAttendanceService;
use App\Support\AttendanceScore;
use App\Support\ListQuery;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function __construct(
        protected RecordAttendanceService $recordAttendanceService,
    ) {}

    public function mark(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $classId = $request->integer('class_id') ?: null;
        $date = $request->string('date')->toString() ?: Carbon::today()->toDateString();

        $enrollments = collect();
        $existingByEnrollment = collect();

        if ($sessionId && $classId) {
            $enrollments = StudentEnrollment::query()
                ->with(['student:id,first_name,last_name,admission_number,photo_path'])
                ->where('academic_session_id', $sessionId)
                // Include promoted/repeated so class rosters match Enrollments for the session.
                ->whereIn('status', ['active', 'promoted', 'repeated'])
                ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
                ->orderBy('roll_number')
                ->orderBy('id')
                ->get()
                ->map(fn (StudentEnrollment $e) => [
                    'student_enrollment_id' => $e->id,
                    'roll_number' => $e->roll_number,
                    'student_name' => trim("{$e->student?->first_name} {$e->student?->last_name}"),
                    'admission_number' => $e->student?->admission_number,
                    'enrollment_status' => $e->status,
                ]);

            if ($enrollments->isNotEmpty()) {
                $existingByEnrollment = StudentAttendance::query()
                    ->where('attendance_date', $date)
                    ->whereIn('student_enrollment_id', $enrollments->pluck('student_enrollment_id'))
                    ->get()
                    ->keyBy('student_enrollment_id');
            }
        }

        $allowedStatuses = ['present', 'absent', 'late'];

        $students = $enrollments->map(function ($row) use ($existingByEnrollment, $allowedStatuses) {
            $existing = $existingByEnrollment->get($row['student_enrollment_id']);
            $status = $existing?->status;
            if ($status !== null && ! in_array($status, $allowedStatuses, true)) {
                $status = null;
            }

            return [
                ...$row,
                'status' => $status,
                'remarks' => $existing?->remarks ?? '',
                'locked' => $existing !== null,
            ];
        });

        $lockedCount = $students->where('locked', true)->count();
        $allLocked = $students->isNotEmpty() && $lockedCount === $students->count();

        return Inertia::render('Admin/Attendance/Mark', [
            'students' => $students,
            'locked' => $allLocked,
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'class_id' => $classId ? (string) $classId : '',
                'date' => $date,
            ],
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name', 'code']),
            'statusOptions' => ['present', 'absent', 'late'],
        ]);
    }

    public function store(StoreAttendanceRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $this->recordAttendanceService->upsert(
                (int) $data['academic_session_id'],
                (int) $data['class_id'],
                $data['attendance_date'],
                $data['records'],
                $request->user()?->id,
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['records' => $e->getMessage()]);
        }

        return redirect()
            ->route('admin.attendance.mark', [
                'session_id' => $data['academic_session_id'],
                'class_id' => $data['class_id'],
                'date' => $data['attendance_date'],
            ])
            ->with('success', 'Attendance saved successfully.');
    }

    public function index(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: null;
        $classId = $request->integer('class_id') ?: null;
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();
        $status = $request->string('status')->trim()->toString();

        if (! $sessionId) {
            $sessionId = AcademicSession::query()->where('is_current', true)->value('id');
        }
        $perPage = ListQuery::perPage($request);

        $sessionOptions = AcademicSession::query()->orderByDesc('is_current')->orderByDesc('start_date')->get(['id', 'name', 'is_current']);
        $classOptions = SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name', 'code']);
        $statusOptions = ['present', 'absent', 'late'];
        $filters = [
            'session_id' => $sessionId ? (string) $sessionId : '',
            'class_id' => $classId ? (string) $classId : '',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'status' => $status,
            'per_page' => (string) $perPage,
        ];

        // Drill-down: class selected → enrolled students list.
        if ($classId) {
            $selectedClass = $classOptions->firstWhere('id', $classId);
            $enrollmentId = $request->integer('enrollment_id') ?: null;

            $students = StudentEnrollment::query()
                ->with([
                    'student:id,first_name,last_name,admission_number',
                    'section.schoolClass:id,name,code',
                ])
                ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
                ->whereIn('status', ['active', 'promoted', 'repeated'])
                ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
                ->orderBy('roll_number')
                ->orderBy('id')
                ->paginate($perPage)
                ->withQueryString()
                ->through(fn (StudentEnrollment $e) => [
                    'enrollment_id' => $e->id,
                    'student_id' => $e->student_id,
                    'student_name' => trim("{$e->student?->first_name} {$e->student?->last_name}"),
                    'admission_number' => $e->student?->admission_number,
                    'roll_number' => $e->roll_number,
                    'class_name' => $e->section?->schoolClass?->name ?? $selectedClass?->name,
                    'class_id' => $classId,
                ]);

            $viewingStudent = null;
            $studentAttendance = [];
            $month = $request->integer('month') ?: null;
            $year = $request->integer('year') ?: null;

            if ($enrollmentId) {
                $enrollment = StudentEnrollment::query()
                    ->with(['student:id,first_name,last_name,admission_number', 'section.schoolClass:id,name'])
                    ->whereKey($enrollmentId)
                    ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
                    ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
                    ->first();

                if ($enrollment) {
                    // Default month/year to latest attendance date, else today.
                    if (! $month || ! $year) {
                        $latestDate = StudentAttendance::query()
                            ->where('student_enrollment_id', $enrollment->id)
                            ->orderByDesc('attendance_date')
                            ->value('attendance_date');

                        $anchor = $latestDate ? Carbon::parse($latestDate) : Carbon::today();
                        $month = $month ?: (int) $anchor->format('n');
                        $year = $year ?: (int) $anchor->format('Y');
                    }

                    $month = max(1, min(12, (int) $month));
                    $year = max(2000, min(2100, (int) $year));

                    $viewingStudent = [
                        'enrollment_id' => $enrollment->id,
                        'student_id' => $enrollment->student_id,
                        'student_name' => trim("{$enrollment->student?->first_name} {$enrollment->student?->last_name}"),
                        'admission_number' => $enrollment->student?->admission_number,
                        'class_name' => $enrollment->section?->schoolClass?->name ?? $selectedClass?->name,
                    ];

                    $studentAttendance = StudentAttendance::query()
                        ->with(['markedByUser:id,name'])
                        ->where('student_enrollment_id', $enrollment->id)
                        ->whereYear('attendance_date', $year)
                        ->whereMonth('attendance_date', $month)
                        ->orderByDesc('attendance_date')
                        ->orderByDesc('id')
                        ->get()
                        ->map(fn (StudentAttendance $row) => [
                            'id' => $row->id,
                            'date' => $row->attendance_date?->format('Y-m-d'),
                            'status' => $row->status,
                            'remarks' => $row->remarks,
                            'marked_by' => $row->markedByUser?->name,
                        ])
                        ->values();
                }
            }

            $filters['enrollment_id'] = $enrollmentId ? (string) $enrollmentId : '';
            $filters['month'] = $month ? (string) $month : '';
            $filters['year'] = $year ? (string) $year : '';

            return Inertia::render('Admin/Attendance/Index', [
                'view' => 'students',
                'classes' => [],
                'students' => $students,
                'records' => null,
                'selectedClass' => $selectedClass
                    ? ['id' => $selectedClass->id, 'name' => $selectedClass->name, 'code' => $selectedClass->code]
                    : null,
                'viewingStudent' => $viewingStudent,
                'studentAttendance' => $studentAttendance,
                'filters' => $filters,
                'sessionOptions' => $sessionOptions,
                'classOptions' => $classOptions,
                'statusOptions' => $statusOptions,
                'monthOptions' => collect(range(1, 12))->map(fn (int $m) => [
                    'value' => (string) $m,
                    'label' => Carbon::createFromDate(2000, $m, 1)->format('F'),
                ])->values(),
                'yearOptions' => collect(range((int) date('Y') + 1, (int) date('Y') - 5))
                    ->map(fn (int $y) => (string) $y)
                    ->values(),
            ]);
        }

        // Default: simple class listing; click a class to see students.
        $studentsByClass = StudentEnrollment::query()
            ->join('sections', 'sections.id', '=', 'student_enrollments.section_id')
            ->when($sessionId, fn ($q) => $q->where('student_enrollments.academic_session_id', $sessionId))
            ->whereIn('student_enrollments.status', ['active', 'promoted', 'repeated'])
            ->whereNull('student_enrollments.deleted_at')
            ->groupBy('sections.class_id')
            ->selectRaw('sections.class_id as class_id, COUNT(*) as students_count')
            ->pluck('students_count', 'class_id');

        $classes = $classOptions->map(fn (SchoolClass $class) => [
            'id' => $class->id,
            'name' => $class->name,
            'code' => $class->code,
            'students_count' => (int) ($studentsByClass[$class->id] ?? 0),
        ])->values();

        return Inertia::render('Admin/Attendance/Index', [
            'view' => 'classes',
            'classes' => $classes,
            'students' => null,
            'records' => null,
            'selectedClass' => null,
            'viewingStudent' => null,
            'studentAttendance' => [],
            'filters' => $filters,
            'sessionOptions' => $sessionOptions,
            'classOptions' => $classOptions,
            'statusOptions' => $statusOptions,
        ]);
    }

    public function reports(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $classId = $request->integer('class_id') ?: null;
        $dateFrom = $request->string('date_from')->toString() ?: Carbon::now()->startOfMonth()->toDateString();
        $dateTo = $request->string('date_to')->toString() ?: Carbon::today()->toDateString();

        $reportRows = collect();

        if ($sessionId && $classId) {
            $enrollments = StudentEnrollment::query()
                ->with(['student:id,first_name,last_name,admission_number', 'section.schoolClass:id,name'])
                ->where('academic_session_id', $sessionId)
                // Match Mark Attendance / Records roster (active + promoted + repeated).
                ->whereIn('status', ['active', 'promoted', 'repeated'])
                ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
                ->orderBy('roll_number')
                ->get();

            $enrollmentIds = $enrollments->pluck('id');

            $attendanceByEnrollment = StudentAttendance::query()
                ->whereIn('student_enrollment_id', $enrollmentIds)
                ->when($dateFrom !== '', fn ($q) => $q->whereDate('attendance_date', '>=', $dateFrom))
                ->when($dateTo !== '', fn ($q) => $q->whereDate('attendance_date', '<=', $dateTo))
                ->get(['student_enrollment_id', 'status'])
                ->groupBy('student_enrollment_id');

            $reportRows = $enrollments->map(function (StudentEnrollment $enrollment) use ($attendanceByEnrollment) {
                $statuses = ($attendanceByEnrollment->get($enrollment->id) ?? collect())->pluck('status');
                $markedDays = $statuses->count();
                $percentage = AttendanceScore::percentageFromStatuses($statuses);

                $counts = $statuses->countBy();

                return [
                    'student_enrollment_id' => $enrollment->id,
                    'roll_number' => $enrollment->roll_number,
                    'student_name' => trim("{$enrollment->student?->first_name} {$enrollment->student?->last_name}"),
                    'admission_number' => $enrollment->student?->admission_number,
                    'class_name' => $enrollment->section?->schoolClass?->name,
                    'section_name' => $enrollment->section?->name,
                    'marked_days' => $markedDays,
                    'present' => (int) ($counts['present'] ?? 0),
                    'absent' => (int) ($counts['absent'] ?? 0),
                    'late' => (int) ($counts['late'] ?? 0),
                    'half_day' => (int) ($counts['half_day'] ?? 0),
                    'excused' => (int) ($counts['excused'] ?? 0),
                    'percentage' => $percentage,
                ];
            });
        }

        $sessionName = $sessionId
            ? AcademicSession::query()->whereKey($sessionId)->value('name')
            : null;

        return Inertia::render('Admin/Attendance/Reports', [
            'reportRows' => $reportRows,
            'reportMeta' => [
                'session_name' => $sessionName,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'class_id' => $classId ? (string) $classId : '',
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name', 'code']),
        ]);
    }
}
