<?php

namespace App\Http\Controllers\Admin\Exams;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Exams\StoreExamMarksRequest;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\ExamSchedule;
use App\Models\ExamType;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Support\DefaultSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MarksController extends Controller
{
    public function index(Request $request): Response
    {
        $examTypeId = $request->integer('exam_type_id') ?: null;
        $sessionId = $request->integer('session_id') ?: null;
        $examId = $request->integer('exam_id') ?: null;
        $classId = $request->integer('class_id') ?: null;
        $subjectId = $request->integer('subject_id') ?: null;

        $schedule = null;
        $rows = collect();

        if ($examId && $classId && $subjectId) {
            $sectionId = DefaultSection::idForClass($classId);

            $schedule = ExamSchedule::query()
                ->with([
                    'exam:id,name,academic_session_id,exam_type_id',
                    'section.schoolClass:id,name',
                    'subject:id,name',
                ])
                ->where('exam_id', $examId)
                ->where('section_id', $sectionId)
                ->where('subject_id', $subjectId)
                ->first();

            if ($schedule) {
                $examSessionId = $schedule->exam?->academic_session_id;

                // Same roster rules as Attendance: class + session, include promoted/repeated.
                $enrollments = StudentEnrollment::query()
                    ->with('student:id,first_name,last_name,admission_number')
                    ->when($examSessionId, fn ($q) => $q->where('academic_session_id', $examSessionId))
                    ->whereIn('status', ['active', 'promoted', 'repeated'])
                    ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
                    ->orderBy('roll_number')
                    ->orderBy('id')
                    ->get();

                $existing = ExamMark::query()
                    ->where('exam_schedule_id', $schedule->id)
                    ->get()
                    ->keyBy('student_enrollment_id');

                $rows = $enrollments->map(function (StudentEnrollment $enrollment) use ($existing) {
                    $mark = $existing->get($enrollment->id);

                    return [
                        'student_enrollment_id' => $enrollment->id,
                        'roll_number' => $enrollment->roll_number,
                        'student_name' => trim("{$enrollment->student?->first_name} {$enrollment->student?->last_name}"),
                        'admission_number' => $enrollment->student?->admission_number,
                        'attendance_status' => $mark?->attendance_status ?? 'present',
                        'obtained_marks' => $mark?->obtained_marks !== null ? (float) $mark->obtained_marks : '',
                        'remarks' => $mark?->remarks ?? '',
                    ];
                });
            }
        }

        $examOptions = collect();
        if ($examTypeId && $sessionId) {
            $examOptions = Exam::query()
                ->where('exam_type_id', $examTypeId)
                ->where('academic_session_id', $sessionId)
                ->orderByDesc('start_date')
                ->get(['id', 'name']);
        }

        $classOptions = collect();
        if ($examId) {
            $classOptions = SchoolClass::query()
                ->whereHas('sections.examSchedules', fn ($q) => $q->where('exam_id', $examId))
                ->orderBy('sort_order')
                ->get(['id', 'name']);
        }

        $subjectOptions = collect();
        if ($examId && $classId) {
            $sectionId = DefaultSection::idForClass($classId);
            $subjectOptions = ExamSchedule::query()
                ->with('subject:id,name')
                ->where('exam_id', $examId)
                ->where('section_id', $sectionId)
                ->orderBy('exam_date')
                ->get()
                ->map(fn (ExamSchedule $s) => [
                    'id' => $s->subject_id,
                    'name' => $s->subject?->name,
                    'exam_schedule_id' => $s->id,
                    'total_marks' => (int) $s->total_marks,
                ])
                ->filter(fn ($s) => $s['name'])
                ->values();
        }

        return Inertia::render('Admin/Exams/Marks/Index', [
            'examTypeOptions' => ExamType::query()->orderBy('name')->get(['id', 'name']),
            'sessionOptions' => AcademicSession::query()
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'is_current']),
            'examOptions' => $examOptions,
            'classOptions' => $classOptions,
            'subjectOptions' => $subjectOptions,
            'filters' => [
                'exam_type_id' => $examTypeId ? (string) $examTypeId : '',
                'session_id' => $sessionId ? (string) $sessionId : '',
                'exam_id' => $examId ? (string) $examId : '',
                'class_id' => $classId ? (string) $classId : '',
                'subject_id' => $subjectId ? (string) $subjectId : '',
            ],
            'schedule' => $schedule ? [
                'id' => $schedule->id,
                'exam_name' => $schedule->exam?->name,
                'subject_name' => $schedule->subject?->name,
                'section_name' => $schedule->section?->name,
                'class_name' => $schedule->section?->schoolClass?->name,
                'total_marks' => (int) $schedule->total_marks,
                'passing_marks' => (int) $schedule->passing_marks,
            ] : null,
            'rows' => $rows->values(),
        ]);
    }

    public function store(StoreExamMarksRequest $request): RedirectResponse
    {
        $scheduleId = (int) $request->validated('exam_schedule_id');
        $userId = Auth::id();

        foreach ($request->validated('marks') as $row) {
            $absent = ($row['attendance_status'] ?? 'present') === 'absent';

            ExamMark::query()->updateOrCreate(
                [
                    'exam_schedule_id' => $scheduleId,
                    'student_enrollment_id' => $row['student_enrollment_id'],
                ],
                [
                    'attendance_status' => $absent ? 'absent' : 'present',
                    'obtained_marks' => $absent ? null : $row['obtained_marks'],
                    'remarks' => $row['remarks'] ?? null,
                    'entered_by' => $userId,
                ],
            );
        }

        $schedule = ExamSchedule::query()
            ->with(['exam:id,academic_session_id,exam_type_id', 'section:id,class_id'])
            ->find($scheduleId);

        return redirect()
            ->route('admin.exams.marks', [
                'exam_type_id' => $schedule?->exam?->exam_type_id,
                'session_id' => $schedule?->exam?->academic_session_id,
                'exam_id' => $schedule?->exam_id,
                'class_id' => $schedule?->section?->class_id,
                'subject_id' => $schedule?->subject_id,
            ])
            ->with('success', 'Marks saved.');
    }
}
