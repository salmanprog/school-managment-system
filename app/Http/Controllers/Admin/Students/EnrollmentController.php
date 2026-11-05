<?php

namespace App\Http\Controllers\Admin\Students;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Support\ListQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $sessionId = $request->integer('session_id') ?: null;
        $classId = $request->integer('class_id') ?: null;
        $status = $request->string('status')->trim()->toString();

        if (! $sessionId) {
            $sessionId = AcademicSession::query()->where('is_current', true)->value('id');
        }
        $perPage = ListQuery::perPage($request);

        $enrollments = StudentEnrollment::query()
            ->with([
                'student:id,admission_number,first_name,last_name,status',
                'section.schoolClass:id,name,code',
                'academicSession:id,name',
            ])
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->when($classId, fn ($q) => $q->whereHas('section', fn ($s) => $s->where('class_id', $classId)))
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->whereHas('student', function ($student) use ($search) {
                    $student->where('admission_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('enrollment_date')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (StudentEnrollment $row) => [
                'id' => $row->id,
                'roll_number' => $row->roll_number,
                'enrollment_date' => $row->enrollment_date?->format('Y-m-d'),
                'status' => $row->status,
                'student' => $row->student ? [
                    'id' => $row->student->id,
                    'admission_number' => $row->student->admission_number,
                    'full_name' => trim("{$row->student->first_name} {$row->student->last_name}"),
                    'status' => $row->student->status,
                ] : null,
                'class_name' => $row->section?->schoolClass?->name,
                'section_name' => $row->section?->name,
                'session_name' => $row->academicSession?->name,
            ]);

        return Inertia::render('Admin/Students/Enrollments/Index', [
            'enrollments' => $enrollments,
            'filters' => [
                'search' => $search,
                'session_id' => $sessionId ? (string) $sessionId : '',
                'class_id' => $classId ? (string) $classId : '',
                'status' => $status,
                'per_page' => (string) $perPage,
            ],
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name']),
            'statusOptions' => ['active', 'promoted', 'repeated', 'graduated', 'inactive'],
        ]);
    }
}
