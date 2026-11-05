<?php

namespace App\Http\Controllers\Admin\Exams;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\ExamSchedule;
use App\Models\ReportCard;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\StudentEnrollment;
use App\Services\Exams\CalculateReportCardsService;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ResultController extends Controller
{
    public function __construct(
        protected CalculateReportCardsService $calculateReportCardsService,
    ) {}

    public function index(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $examId = $request->integer('exam_id') ?: null;
        $classId = $request->integer('class_id') ?: null;
        $perPage = ListQuery::perPage($request);
        $page = max(1, $request->integer('page') ?: 1);

        $exams = Exam::query()
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->orderByDesc('start_date')
            ->get(['id', 'name', 'status']);

        $classOptions = collect();
        if ($examId) {
            $classOptions = SchoolClass::query()
                ->whereHas('sections.examSchedules', fn ($q) => $q->where('exam_id', $examId))
                ->orderBy('sort_order')
                ->get(['id', 'name']);
        }

        $results = null;
        $marksReadyCount = 0;

        if ($examId && $classId) {
            $reportCards = ReportCard::query()
                ->where('exam_id', $examId)
                ->get()
                ->keyBy('student_enrollment_id');

            $schedules = ExamSchedule::query()
                ->with(['subject:id,name,code', 'section:id,class_id'])
                ->where('exam_id', $examId)
                ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
                ->orderBy('exam_date')
                ->orderBy('start_time')
                ->get();

            $scheduleIds = $schedules->pluck('id');

            $marksByEnrollment = ExamMark::query()
                ->whereIn('exam_schedule_id', $scheduleIds)
                ->get()
                ->groupBy('student_enrollment_id');

            $examName = Exam::query()->whereKey($examId)->value('name');
            $sessionName = $sessionId
                ? AcademicSession::query()->whereKey($sessionId)->value('name')
                : null;

            $rows = StudentEnrollment::query()
                ->with([
                    'student:id,first_name,last_name,admission_number,gender,date_of_birth,photo_path,status',
                    'student.guardians' => fn ($q) => $q->limit(2),
                    'section:id,class_id,name',
                    'section.schoolClass:id,name',
                ])
                ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
                ->whereIn('status', ['active', 'promoted', 'repeated'])
                ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
                ->orderBy('roll_number')
                ->orderBy('id')
                ->get()
                ->map(function (StudentEnrollment $enrollment) use ($reportCards, $schedules, $marksByEnrollment, $examName, $sessionName) {
                    $card = $reportCards->get($enrollment->id);
                    $student = $enrollment->student;
                    $marks = $marksByEnrollment->get($enrollment->id, collect())->keyBy('exam_schedule_id');
                    $guardians = $student?->guardians ?? collect();
                    $primaryGuardian = $guardians->first(fn ($g) => (bool) ($g->pivot?->is_primary))
                        ?? $guardians->first();

                    $subjectMarks = $schedules->map(function (ExamSchedule $schedule) use ($marks) {
                        $mark = $marks->get($schedule->id);

                        return [
                            'schedule_id' => $schedule->id,
                            'subject_name' => $schedule->subject?->name,
                            'subject_code' => $schedule->subject?->code,
                            'exam_date' => $schedule->exam_date?->format('Y-m-d'),
                            'total_marks' => (int) $schedule->total_marks,
                            'passing_marks' => (int) $schedule->passing_marks,
                            'attendance_status' => $mark?->attendance_status,
                            'obtained_marks' => $mark?->obtained_marks !== null ? (float) $mark->obtained_marks : null,
                            'remarks' => $mark?->remarks,
                            'entered' => $mark !== null,
                        ];
                    })->values()->all();

                    return [
                        'id' => $card?->id ?? 'enrollment-'.$enrollment->id,
                        'student_enrollment_id' => $enrollment->id,
                        'roll_number' => $enrollment->roll_number,
                        'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : null,
                        'admission_number' => $student?->admission_number,
                        'gender' => $student?->gender,
                        'date_of_birth' => $student?->date_of_birth?->format('Y-m-d'),
                        'photo_url' => $student?->photo_path ? Storage::url($student->photo_path) : null,
                        'student_status' => $student?->status,
                        'guardian_name' => $primaryGuardian?->full_name,
                        'guardian_relationship' => $primaryGuardian?->pivot?->relationship,
                        'class_name' => $enrollment->section?->schoolClass?->name,
                        'section_name' => $enrollment->section?->name,
                        'session_name' => $sessionName,
                        'enrollment_status' => $enrollment->status,
                        'exam_name' => $examName,
                        'total_marks' => $card ? (float) $card->total_marks : null,
                        'obtained_marks' => $card ? (float) $card->obtained_marks : null,
                        'percentage' => $card ? (float) $card->percentage : null,
                        'grade' => $card?->grade,
                        'result_status' => $card?->result_status,
                        'has_result' => $card !== null,
                        'published_at' => $card?->published_at?->toDateTimeString(),
                        'subject_marks' => $subjectMarks,
                    ];
                })
                ->values();

            $total = $rows->count();
            $items = $rows->forPage($page, $perPage)->values();

            $results = new LengthAwarePaginator(
                $items,
                $total,
                $perPage,
                $page,
                [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ],
            );

            if ($scheduleIds->isNotEmpty()) {
                $enrollmentIds = $rows->pluck('student_enrollment_id');
                $marksReadyCount = (int) ExamMark::query()
                    ->whereIn('exam_schedule_id', $scheduleIds)
                    ->whereIn('student_enrollment_id', $enrollmentIds)
                    ->distinct()
                    ->count('student_enrollment_id');
            }
        }

        $school = SchoolSetting::query()->first();

        return Inertia::render('Admin/Exams/Results/Index', [
            'exams' => $exams,
            'classOptions' => $classOptions,
            'results' => $results,
            'marksReadyCount' => $marksReadyCount,
            'school' => [
                'name' => $school?->school_name ?: config('app.name', 'Campus'),
                'logo_url' => $school?->logo ? Storage::disk('public')->url($school->logo) : null,
            ],
            'sessionOptions' => AcademicSession::query()
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'is_current']),
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'exam_id' => $examId ? (string) $examId : '',
                'class_id' => $classId ? (string) $classId : '',
                'per_page' => (string) $perPage,
            ],
        ]);
    }

    public function calculate(Request $request): RedirectResponse
    {
        $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'publish' => ['nullable', 'boolean'],
            'session_id' => ['nullable', 'exists:academic_sessions,id'],
            'class_id' => ['nullable', 'exists:school_classes,id'],
        ]);

        $exam = Exam::query()->findOrFail($request->integer('exam_id'));
        $publish = $request->boolean('publish');

        try {
            $result = $this->calculateReportCardsService->calculate($exam, $publish);
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['calculate' => $e->getMessage()]);
        }

        $message = $publish
            ? "Published results for {$result['processed']} student(s)."
            : "Calculated results for {$result['processed']} student(s).";

        return redirect()
            ->route('admin.exams.results', [
                'session_id' => $request->input('session_id') ?: $exam->academic_session_id,
                'exam_id' => $exam->id,
                'class_id' => $request->input('class_id') ?: null,
            ])
            ->with('success', $message);
    }
}
