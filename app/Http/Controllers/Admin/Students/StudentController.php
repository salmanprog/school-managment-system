<?php

namespace App\Http\Controllers\Admin\Students;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Students\StoreStudentRequest;
use App\Http\Requests\Admin\Students\UpdateStudentRequest;
use App\Models\AcademicSession;
use App\Models\Guardian;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGuardian;
use App\Support\AdmissionNumberGenerator;
use App\Support\DefaultSection;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $sessionId = $request->integer('session_id') ?: null;
        $classId = $request->integer('class_id') ?: null;

        if (! $sessionId) {
            $sessionId = AcademicSession::query()->where('is_current', true)->value('id');
        }
        $perPage = ListQuery::perPage($request);

        $query = Student::query()
            ->with([
                'guardians' => fn ($q) => $q->wherePivot('is_primary', true)->limit(1),
            ])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('admission_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($sessionId || $classId, function ($q) use ($sessionId, $classId) {
                $q->whereHas('enrollments', function ($enrollment) use ($sessionId, $classId) {
                    if ($sessionId) {
                        $enrollment->where('academic_session_id', $sessionId)->where('status', 'active');
                    }
                    if ($classId) {
                        $enrollment->whereHas('section', fn ($s) => $s->where('class_id', $classId));
                    }
                });
            })
            ->orderBy('first_name')
            ->orderBy('last_name');

        $students = $query
            ->paginate($perPage)
            ->withQueryString();

        $studentIds = collect($students->items())->pluck('id');
        $enrollmentsByStudent = StudentEnrollment::query()
            ->with(['section.schoolClass', 'academicSession:id,name'])
            ->whereIn('student_id', $studentIds)
            ->when($sessionId, fn ($q) => $q->where('academic_session_id', $sessionId))
            ->where('status', 'active')
            ->get()
            ->keyBy('student_id');

        $students->through(function (Student $student) use ($enrollmentsByStudent) {
            $enrollment = $enrollmentsByStudent->get($student->id);
            $primaryGuardian = $student->guardians->first();

            return [
                'id' => $student->id,
                'admission_number' => $student->admission_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'full_name' => trim("{$student->first_name} {$student->last_name}"),
                'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
                'gender' => $student->gender,
                'admission_date' => $student->admission_date?->format('Y-m-d'),
                'address' => $student->address,
                'photo_url' => $student->photo_path ? Storage::url($student->photo_path) : null,
                'status' => $student->status,
                'roll_number' => $enrollment?->roll_number,
                'class_name' => $enrollment?->section?->schoolClass?->name,
                'section_name' => $enrollment?->section?->name,
                'guardian_name' => $primaryGuardian?->full_name,
                'guardian_phone' => $primaryGuardian?->phone,
                'guardian_email' => $primaryGuardian?->email,
                'guardian_relationship' => $primaryGuardian?->pivot?->relationship ?? 'parent',
            ];
        });

        return Inertia::render('Admin/Students/Index', [
            'students' => $students,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'session_id' => $sessionId ? (string) $sessionId : '',
                'class_id' => $classId ? (string) $classId : '',
                'per_page' => (string) $perPage,
            ],
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->orderByDesc('start_date')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name', 'code']),
            'genderOptions' => ['male', 'female', 'other'],
            'statusOptions' => ['active', 'inactive', 'transferred', 'graduated'],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Students/Create', [
            'sessionOptions' => AcademicSession::query()->orderByDesc('is_current')->get(['id', 'name', 'is_current']),
            'classOptions' => SchoolClass::query()->where('status', EntityStatus::Active->value)->orderBy('sort_order')->get(['id', 'name']),
            'genderOptions' => ['male', 'female', 'other'],
            'statusOptions' => ['active', 'inactive', 'transferred', 'graduated'],
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $student = DB::transaction(function () use ($request, $data) {
            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('students/photos', 'public');
            }

            $student = Student::query()->create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'date_of_birth' => $data['date_of_birth'],
                'gender' => $data['gender'],
                'admission_date' => $data['admission_date'],
                'address' => $data['address'] ?? null,
                'status' => $data['status'] ?? 'active',
                'photo_path' => $photoPath,
                'admission_number' => AdmissionNumberGenerator::nextAdmissionNumber(),
            ]);

            $guardian = Guardian::query()->firstOrCreate(
                ['phone' => $data['guardian_phone']],
                [
                    'full_name' => $data['guardian_full_name'],
                    'email' => $data['guardian_email'] ?? null,
                    'address' => $data['address'] ?? null,
                ]
            );

            if ($guardian->wasRecentlyCreated === false) {
                $guardian->update([
                    'full_name' => $data['guardian_full_name'],
                    'email' => $data['guardian_email'] ?? $guardian->email,
                ]);
            }

            StudentGuardian::query()->create([
                'student_id' => $student->id,
                'guardian_id' => $guardian->id,
                'relationship' => $data['guardian_relationship'] ?? 'parent',
                'is_primary' => true,
                'is_emergency_contact' => true,
            ]);

            $sessionId = $data['academic_session_id']
                ?? AcademicSession::query()->where('is_current', true)->value('id');

            StudentEnrollment::query()->create([
                'student_id' => $student->id,
                'academic_session_id' => $sessionId,
                'section_id' => DefaultSection::idForClass((int) $data['class_id']),
                'roll_number' => $data['roll_number'] ?? null,
                'enrollment_date' => $data['admission_date'],
                'status' => 'active',
            ]);

            return $student;
        });

        return redirect()
            ->route('admin.students.show', $student)
            ->with('success', 'Student created successfully.');
    }

    public function show(Request $request, Student $student): Response
    {
        $tab = $request->string('tab')->toString() ?: 'personal';

        $student->load([
            'guardians',
            'documents',
            'enrollments.section.schoolClass',
            'enrollments.academicSession',
        ]);

        $currentSessionId = AcademicSession::query()->where('is_current', true)->value('id');
        $currentEnrollment = $student->enrollments
            ->first(fn ($e) => $e->academic_session_id === $currentSessionId && $e->status === 'active')
            ?? $student->enrollments->sortByDesc('enrollment_date')->first();

        $tabData = [];

        if ($tab === 'attendance' && $currentEnrollment) {
            $currentEnrollment->load(['attendanceRecords' => fn ($q) => $q->orderByDesc('attendance_date')->limit(30)]);
            $tabData['attendance'] = $currentEnrollment->attendanceRecords->map(fn ($row) => [
                'date' => $row->attendance_date?->format('Y-m-d'),
                'status' => $row->status,
                'remarks' => $row->remarks,
            ]);
        }

        if ($tab === 'fees' && $currentEnrollment) {
            $currentEnrollment->load(['feeInvoices' => fn ($q) => $q->orderByDesc('invoice_date')->limit(20)]);
            $tabData['invoices'] = $currentEnrollment->feeInvoices->map(fn ($inv) => [
                'invoice_number' => $inv->invoice_number,
                'invoice_date' => $inv->invoice_date?->format('Y-m-d'),
                'total_amount' => $inv->total_amount,
                'status' => $inv->status,
            ]);
        }

        if ($tab === 'exams' && $currentEnrollment) {
            $currentEnrollment->load(['examMarks.examSchedule.subject', 'examMarks.examSchedule.exam']);
            $tabData['exam_marks'] = $currentEnrollment->examMarks->map(fn ($mark) => [
                'exam' => $mark->examSchedule?->exam?->name,
                'subject' => $mark->examSchedule?->subject?->name,
                'obtained_marks' => $mark->obtained_marks,
                'attendance_status' => $mark->attendance_status,
            ]);
        }

        $primaryGuardian = $student->guardians->first(fn ($g) => (bool) $g->pivot?->is_primary)
            ?? $student->guardians->first();

        $school = SchoolSetting::query()->first();

        return Inertia::render('Admin/Students/Show', [
            'student' => [
                'id' => $student->id,
                'admission_number' => $student->admission_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'full_name' => trim("{$student->first_name} {$student->last_name}"),
                'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
                'gender' => $student->gender,
                'admission_date' => $student->admission_date?->format('Y-m-d'),
                'address' => $student->address,
                'status' => $student->status,
                'photo_url' => $student->photo_path ? Storage::url($student->photo_path) : null,
            ],
            'guardian' => $primaryGuardian ? [
                'full_name' => $primaryGuardian->full_name,
                'phone' => $primaryGuardian->phone,
                'email' => $primaryGuardian->email,
                'relationship' => $primaryGuardian->pivot?->relationship,
            ] : null,
            'guardians' => $student->guardians->map(fn ($g) => [
                'full_name' => $g->full_name,
                'phone' => $g->phone,
                'email' => $g->email,
                'relationship' => $g->pivot?->relationship,
                'is_primary' => (bool) $g->pivot?->is_primary,
            ]),
            'enrollments' => $student->enrollments->sortByDesc('enrollment_date')->values()->map(fn ($e) => [
                'id' => $e->id,
                'session' => $e->academicSession?->name,
                'class_name' => $e->section?->schoolClass?->name,
                'section_name' => $e->section?->name,
                'roll_number' => $e->roll_number,
                'enrollment_date' => $e->enrollment_date?->format('Y-m-d'),
                'status' => $e->status,
            ]),
            'documents' => $student->documents->map(fn ($doc) => [
                'id' => $doc->id,
                'document_type' => $doc->document_type,
                'original_filename' => $doc->original_filename,
            ]),
            'current_enrollment' => $currentEnrollment ? [
                'class_name' => $currentEnrollment->section?->schoolClass?->name,
                'section_name' => $currentEnrollment->section?->name,
                'roll_number' => $currentEnrollment->roll_number,
                'session' => $currentEnrollment->academicSession?->name,
            ] : null,
            'school' => [
                'name' => $school?->school_name ?: config('app.name', 'Campus'),
                'logo_url' => $school?->logo ? Storage::disk('public')->url($school->logo) : null,
            ],
            'tab' => $tab,
            'tabData' => $tabData,
        ]);
    }

    public function edit(Student $student): Response
    {
        $student->load(['guardians']);

        $primaryGuardian = $student->guardians->first(fn ($g) => (bool) $g->pivot?->is_primary)
            ?? $student->guardians->first();

        return Inertia::render('Admin/Students/Edit', [
            'student' => [
                'id' => $student->id,
                'admission_number' => $student->admission_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'date_of_birth' => $student->date_of_birth?->format('Y-m-d'),
                'gender' => $student->gender,
                'admission_date' => $student->admission_date?->format('Y-m-d'),
                'address' => $student->address,
                'status' => $student->status,
                'photo_url' => $student->photo_path ? Storage::url($student->photo_path) : null,
            ],
            'guardian' => $primaryGuardian ? [
                'full_name' => $primaryGuardian->full_name,
                'phone' => $primaryGuardian->phone,
                'email' => $primaryGuardian->email,
                'relationship' => $primaryGuardian->pivot?->relationship ?? 'parent',
            ] : [
                'full_name' => '',
                'phone' => '',
                'email' => '',
                'relationship' => 'parent',
            ],
            'genderOptions' => ['male', 'female', 'other'],
            'statusOptions' => ['active', 'inactive', 'transferred', 'graduated'],
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $data, $student) {
            $updates = collect($data)->only([
                'first_name', 'last_name', 'date_of_birth', 'gender', 'admission_date', 'address', 'status',
            ])->all();

            if ($request->hasFile('photo')) {
                if ($student->photo_path) {
                    Storage::disk('public')->delete($student->photo_path);
                }
                $updates['photo_path'] = $request->file('photo')->store('students/photos', 'public');
            }

            $student->update($updates);

            $primaryLink = StudentGuardian::query()
                ->where('student_id', $student->id)
                ->where('is_primary', true)
                ->first();

            $guardian = null;
            if ($primaryLink) {
                $guardian = Guardian::query()->find($primaryLink->guardian_id);
            }

            if (! $guardian) {
                $guardian = Guardian::query()->firstOrCreate(
                    ['phone' => $data['guardian_phone']],
                    ['full_name' => $data['guardian_full_name'], 'email' => $data['guardian_email'] ?? null]
                );
                StudentGuardian::query()->create([
                    'student_id' => $student->id,
                    'guardian_id' => $guardian->id,
                    'relationship' => $data['guardian_relationship'] ?? 'parent',
                    'is_primary' => true,
                    'is_emergency_contact' => true,
                ]);
            } else {
                $guardian->update([
                    'full_name' => $data['guardian_full_name'],
                    'phone' => $data['guardian_phone'],
                    'email' => $data['guardian_email'] ?? null,
                ]);
                $primaryLink?->update(['relationship' => $data['guardian_relationship'] ?? 'parent']);
            }
        });

        return redirect()
            ->back()
            ->with('success', 'Student updated successfully.');
    }
}
