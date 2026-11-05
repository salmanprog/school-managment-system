<?php

namespace App\Http\Controllers\Admin\Teachers;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Teachers\StoreTeacherAssignmentRequest;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeacherAssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $sessionId = $request->integer('session_id') ?: null;
        $teacherId = $request->integer('teacher_id') ?: null;
        $classId = $request->integer('class_id') ?: null;

        if (! $sessionId) {
            $sessionId = AcademicSession::query()->where('is_current', true)->value('id');
        }
        $perPage = ListQuery::perPage($request);

        $assignments = TeacherAssignment::query()
            ->with([
                'teacher:id,employee_number,first_name,last_name',
                'academicSession:id,name',
                'section.schoolClass:id,name',
                'subject:id,name,code',
            ])
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->when($teacherId, fn ($q) => $q->where('teacher_id', $teacherId))
            ->when($classId, fn ($q) => $q->whereHas('section', fn ($s) => $s->where('class_id', $classId)))
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (TeacherAssignment $row) => [
                'id' => $row->id,
                'teacher_id' => $row->teacher_id,
                'teacher_name' => trim("{$row->teacher?->first_name} {$row->teacher?->last_name}"),
                'employee_number' => $row->teacher?->employee_number,
                'session' => $row->academicSession?->name,
                'class_name' => $row->section?->schoolClass?->name,
                'section_name' => $row->section?->name,
                'subject_name' => $row->subject?->name,
                'subject_code' => $row->subject?->code,
            ]);

        return Inertia::render('Admin/Teachers/Assignments/Index', [
            'assignments' => $assignments,
            'filters' => [
                'session_id' => $sessionId ? (string) $sessionId : '',
                'teacher_id' => $teacherId ? (string) $teacherId : '',
                'class_id' => $classId ? (string) $classId : '',
                'per_page' => (string) $perPage,
            ],
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'teacherOptions' => Teacher::query()->where('status', 'active')->orderBy('first_name')->get(['id', 'employee_number', 'first_name', 'last_name']),
            'classOptions' => SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name', 'code']),
            'subjectOptions' => Subject::query()->where('status', EntityStatus::Active->value)->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreTeacherAssignmentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        TeacherAssignment::query()->create($data);

        return redirect()
            ->route('admin.teacher-assignments.index', [
                'session_id' => $data['academic_session_id'],
            ])
            ->with('success', 'Assignment created successfully.');
    }

    public function destroy(TeacherAssignment $teacher_assignment): RedirectResponse
    {
        $teacher_assignment->delete();

        return back()->with('success', 'Assignment removed.');
    }
}
