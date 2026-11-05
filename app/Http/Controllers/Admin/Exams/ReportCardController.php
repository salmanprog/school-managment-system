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
use App\Support\ListQuery;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ReportCardController extends Controller
{
    public function index(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $examId = $request->integer('exam_id') ?: null;
        $classId = $request->integer('class_id') ?: null;
        $search = $request->string('search')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $cards = ReportCard::query()
            ->with([
                'exam:id,name',
                'studentEnrollment.student:id,first_name,last_name,admission_number',
                'studentEnrollment.section.schoolClass:id,name',
            ])
            ->whereNotNull('published_at')
            ->when($examId, fn ($q) => $q->where('exam_id', $examId))
            ->when(
                ! $examId && $sessionId,
                fn ($q) => $q->whereHas('exam', fn ($e) => $e->where('academic_session_id', $sessionId)),
            )
            ->when(
                $classId,
                fn ($q) => $q->whereHas('studentEnrollment.section', fn ($s) => $s->where('class_id', $classId)),
            )
            ->when($search !== '', function ($q) use ($search) {
                $q->whereHas('studentEnrollment.student', function ($s) use ($search) {
                    $s->where('admission_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('published_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (ReportCard $card) {
                $student = $card->studentEnrollment?->student;

                return [
                    'id' => $card->id,
                    'exam_name' => $card->exam?->name,
                    'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : null,
                    'admission_number' => $student?->admission_number,
                    'class_name' => $card->studentEnrollment?->section?->schoolClass?->name,
                    'percentage' => (float) $card->percentage,
                    'grade' => $card->grade,
                    'published_at' => $card->published_at?->format('Y-m-d'),
                ];
            });

        $examOptions = Exam::query()
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->orderByDesc('start_date')
            ->get(['id', 'name']);

        $classOptions = collect();
        if ($examId) {
            $classOptions = SchoolClass::query()
                ->whereHas('sections.examSchedules', fn ($q) => $q->where('exam_id', $examId))
                ->orderBy('sort_order')
                ->get(['id', 'name']);
        } elseif ($sessionId) {
            $classOptions = SchoolClass::query()
                ->whereHas(
                    'sections.examSchedules.exam',
                    fn ($q) => $q->where('academic_session_id', $sessionId),
                )
                ->orderBy('sort_order')
                ->get(['id', 'name']);
        }

        $school = SchoolSetting::query()->first();

        return Inertia::render('Admin/Exams/ReportCards/Index', [
            'reportCards' => $cards,
            'examOptions' => $examOptions,
            'classOptions' => $classOptions,
            'sessionOptions' => AcademicSession::query()
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'is_current']),
            'school' => [
                'name' => $school?->school_name ?: config('app.name', 'Campus'),
                'logo_url' => $school?->logo ? Storage::disk('public')->url($school->logo) : null,
            ],
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'exam_id' => $examId ? (string) $examId : '',
                'class_id' => $classId ? (string) $classId : '',
                'search' => $search,
                'per_page' => (string) $perPage,
            ],
        ]);
    }

    public function pdf(ReportCard $reportCard): HttpResponse
    {
        $reportCard->load([
            'exam.academicSession',
            'studentEnrollment.student.guardians',
            'studentEnrollment.section.schoolClass',
        ]);

        $enrollment = $reportCard->studentEnrollment;
        $student = $enrollment?->student;
        $classId = $enrollment?->section?->class_id;

        $schedules = ExamSchedule::query()
            ->with(['subject:id,name,code'])
            ->where('exam_id', $reportCard->exam_id)
            ->when(
                $classId,
                fn ($q) => $q->whereHas('section', fn ($s) => $s->where('class_id', $classId)),
            )
            ->orderBy('exam_date')
            ->orderBy('start_time')
            ->get();

        $marks = ExamMark::query()
            ->whereIn('exam_schedule_id', $schedules->pluck('id'))
            ->where('student_enrollment_id', $reportCard->student_enrollment_id)
            ->get()
            ->keyBy('exam_schedule_id');

        $subjectMarks = $schedules->map(function (ExamSchedule $schedule) use ($marks) {
            $mark = $marks->get($schedule->id);
            $absent = $mark && $mark->attendance_status === 'absent';

            return [
                'subject_name' => $schedule->subject?->name,
                'subject_code' => $schedule->subject?->code,
                'total_marks' => (int) $schedule->total_marks,
                'passing_marks' => (int) $schedule->passing_marks,
                'absent' => (bool) $absent,
                'obtained_marks' => $absent
                    ? null
                    : ($mark?->obtained_marks !== null ? (float) $mark->obtained_marks : null),
            ];
        })->values()->all();

        $guardians = $student?->guardians ?? collect();
        $primaryGuardian = $guardians->first(fn ($g) => (bool) ($g->pivot?->is_primary))
            ?? $guardians->first();

        $school = SchoolSetting::query()->first();
        $logoPath = null;
        if ($school?->logo && Storage::disk('public')->exists($school->logo)) {
            $logoPath = Storage::disk('public')->path($school->logo);
        }

        $photoPath = null;
        if ($student?->photo_path && Storage::disk('public')->exists($student->photo_path)) {
            $photoPath = Storage::disk('public')->path($student->photo_path);
        }

        $card = [
            'school_name' => $school?->school_name ?: config('app.name', 'Campus School'),
            'logo_path' => $logoPath,
            'photo_path' => $photoPath,
            'admission_number' => $student?->admission_number,
            'roll_number' => $enrollment?->roll_number,
            'student_name' => $student ? trim("{$student->first_name} {$student->last_name}") : null,
            'gender' => $student?->gender,
            'date_of_birth' => $student?->date_of_birth?->format('Y-m-d'),
            'guardian_name' => $primaryGuardian?->full_name,
            'guardian_relationship' => $primaryGuardian?->pivot?->relationship,
            'class_name' => $enrollment?->section?->schoolClass?->name,
            'section_name' => $enrollment?->section?->name,
            'session_name' => $reportCard->exam?->academicSession?->name,
            'exam_name' => $reportCard->exam?->name,
            'total_marks' => (float) $reportCard->total_marks,
            'obtained_marks' => (float) $reportCard->obtained_marks,
            'percentage' => (float) $reportCard->percentage,
            'grade' => $reportCard->grade,
            'result_status' => $reportCard->result_status,
            'published_at' => $reportCard->published_at?->format('Y-m-d'),
            'subject_marks' => $subjectMarks,
        ];

        $pdf = Pdf::loadView('pdf.report-card', [
            'card' => $card,
        ])->setPaper('a4', 'portrait');

        $filename = 'grade-card-'.($student?->admission_number ?? $reportCard->id).'.pdf';

        return $pdf->download($filename);
    }
}
