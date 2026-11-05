<?php

namespace App\Http\Controllers\Admin\Exams;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Exams\StoreExamScheduleRequest;
use App\Http\Requests\Admin\Exams\UpdateExamScheduleRequest;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\ExamSchedule;
use App\Models\ExamType;
use App\Models\SchoolClass;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class ExamScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $examTypeId = $request->integer('exam_type_id') ?: null;
        $examId = $request->integer('exam_id') ?: null;
        $sessionId = $request->integer('session_id') ?: AcademicSession::query()->where('is_current', true)->value('id');
        $perPage = ListQuery::perPage($request);
        $page = max(1, $request->integer('page') ?: 1);

        $scheduleRows = ExamSchedule::query()
            ->with([
                'exam:id,name,academic_session_id,exam_type_id',
                'exam.examType:id,name',
                'section.schoolClass:id,name',
                'subject:id,name,code',
            ])
            ->when($examId, fn ($q) => $q->where('exam_id', $examId))
            ->when($examTypeId, function ($q) use ($examTypeId) {
                $q->whereHas('exam', fn ($e) => $e->where('exam_type_id', $examTypeId));
            })
            ->when(
                $sessionId,
                fn ($q) => $q->whereHas('exam', fn ($e) => $e->where('academic_session_id', $sessionId)),
            )
            ->orderBy('exam_date')
            ->orderBy('start_time')
            ->get();

        $groups = $scheduleRows
            ->groupBy(function (ExamSchedule $row) {
                $classId = $row->section?->schoolClass?->id ?? 0;

                return $row->exam_id.'-'.$classId;
            })
            ->map(function ($rows) {
                /** @var ExamSchedule $first */
                $first = $rows->first();
                $class = $first->section?->schoolClass;

                return [
                    'key' => $first->exam_id.'-'.($class?->id ?? 0),
                    'exam_id' => $first->exam_id,
                    'exam_name' => $first->exam?->name,
                    'exam_type_id' => $first->exam?->exam_type_id,
                    'exam_type' => $first->exam?->examType?->name,
                    'class_id' => $class?->id,
                    'class_name' => $class?->name,
                    'subjects_count' => $rows->count(),
                    'schedules' => $rows->values()->map(fn (ExamSchedule $row) => [
                        'id' => $row->id,
                        'exam_id' => $row->exam_id,
                        'class_id' => $row->section?->schoolClass?->id,
                        'subject_id' => $row->subject_id,
                        'subject_name' => $row->subject?->name,
                        'exam_date' => $row->exam_date?->format('Y-m-d'),
                        'start_time' => substr((string) $row->start_time, 0, 5),
                        'end_time' => substr((string) $row->end_time, 0, 5),
                        'total_marks' => (int) $row->total_marks,
                        'passing_marks' => (int) $row->passing_marks,
                    ])->all(),
                ];
            })
            ->sortBy([
                ['exam_name', 'asc'],
                ['class_name', 'asc'],
            ])
            ->values();

        $total = $groups->count();
        $items = $groups->forPage($page, $perPage)->values();

        $groupsPage = new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );

        return Inertia::render('Admin/Exams/Schedules/Index', [
            'groups' => $groupsPage,
            'sessionOptions' => AcademicSession::query()
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'is_current']),
            'examTypeOptions' => ExamType::query()
                ->orderBy('name')
                ->get(['id', 'name']),
            'examOptions' => Exam::query()
                ->with('examType:id,name')
                ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
                ->orderByDesc('start_date')
                ->get(['id', 'name', 'exam_type_id'])
                ->map(fn (Exam $exam) => [
                    'id' => $exam->id,
                    'name' => $exam->name,
                    'exam_type_id' => $exam->exam_type_id,
                    'exam_type' => $exam->examType?->name,
                ]),
            'subjectsByClass' => SchoolClass::query()
                ->with(['subjects' => fn ($q) => $q
                    ->where('subjects.status', EntityStatus::Active->value)
                    ->orderBy('subjects.name')
                    ->select('subjects.id', 'subjects.name')])
                ->orderBy('sort_order')
                ->get(['id'])
                ->mapWithKeys(fn (SchoolClass $class) => [
                    (string) $class->id => $class->subjects
                        ->map(fn ($subject) => [
                            'id' => $subject->id,
                            'name' => $subject->name,
                        ])
                        ->values(),
                ]),
            'classOptions' => SchoolClass::query()->orderBy('sort_order')->get(['id', 'name']),
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'exam_type_id' => $examTypeId ? (string) $examTypeId : '',
                'exam_id' => $examId ? (string) $examId : '',
                'per_page' => (string) $perPage,
            ],
        ]);
    }

    public function store(StoreExamScheduleRequest $request): RedirectResponse
    {
        ExamSchedule::query()->create($request->validated());

        return redirect()->route('admin.exams.schedules')->with('success', 'Exam schedule created.');
    }

    public function update(UpdateExamScheduleRequest $request, ExamSchedule $examSchedule): RedirectResponse
    {
        $examSchedule->update($request->validated());

        return redirect()->route('admin.exams.schedules')->with('success', 'Exam schedule updated.');
    }

    public function destroy(ExamSchedule $examSchedule): RedirectResponse
    {
        $examSchedule->delete();

        return redirect()->route('admin.exams.schedules')->with('success', 'Exam schedule deleted.');
    }
}
