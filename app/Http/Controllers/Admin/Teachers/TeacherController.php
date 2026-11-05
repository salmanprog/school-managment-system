<?php

namespace App\Http\Controllers\Admin\Teachers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Teachers\StoreTeacherRequest;
use App\Http\Requests\Admin\Teachers\UpdateTeacherRequest;
use App\Models\Teacher;
use App\Support\EmployeeNumberGenerator;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $teachers = Teacher::query()
            ->with([
                'assignments.academicSession:id,name',
                'assignments.section.schoolClass:id,name',
                'assignments.subject:id,name,code',
            ])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('employee_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Teacher $teacher) => [
                'id' => $teacher->id,
                'employee_number' => $teacher->employee_number,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'full_name' => trim("{$teacher->first_name} {$teacher->last_name}"),
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'qualification' => $teacher->qualification,
                'specialization' => $teacher->specialization,
                'status' => $teacher->status,
                'photo_url' => $teacher->photo_path ? Storage::url($teacher->photo_path) : null,
                'joining_date' => $teacher->joining_date?->format('Y-m-d'),
                'assignments' => $teacher->assignments->map(fn ($a) => [
                    'id' => $a->id,
                    'session' => $a->academicSession?->name,
                    'class_name' => $a->section?->schoolClass?->name,
                    'section_name' => $a->section?->name,
                    'subject_name' => $a->subject?->name,
                    'subject_code' => $a->subject?->code,
                ])->values(),
            ]);

        return Inertia::render('Admin/Teachers/Index', [
            'teachers' => $teachers,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => ['active', 'inactive', 'on_leave', 'terminated'],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Teachers/Create', [
            'statusOptions' => ['active', 'inactive', 'on_leave', 'terminated'],
        ]);
    }

    public function store(StoreTeacherRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $teacher = DB::transaction(function () use ($request, $data) {
            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('teachers/photos', 'public');
            }

            return Teacher::query()->create([
                'employee_number' => EmployeeNumberGenerator::next(),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'qualification' => $data['qualification'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'joining_date' => $data['joining_date'],
                'status' => $data['status'] ?? 'active',
                'photo_path' => $photoPath,
            ]);
        });

        return redirect()
            ->route('admin.teachers.index')
            ->with('success', 'Teacher created successfully.');
    }

    public function show(Teacher $teacher): Response
    {
        $teacher->load([
            'assignments.academicSession:id,name,is_current',
            'assignments.section.schoolClass:id,name',
            'assignments.subject:id,name,code',
        ]);

        return Inertia::render('Admin/Teachers/Show', [
            'teacher' => [
                'id' => $teacher->id,
                'employee_number' => $teacher->employee_number,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'full_name' => trim("{$teacher->first_name} {$teacher->last_name}"),
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'qualification' => $teacher->qualification,
                'specialization' => $teacher->specialization,
                'joining_date' => $teacher->joining_date?->format('Y-m-d'),
                'status' => $teacher->status,
                'photo_url' => $teacher->photo_path ? Storage::url($teacher->photo_path) : null,
            ],
            'assignments' => $teacher->assignments->map(fn ($a) => [
                'id' => $a->id,
                'session' => $a->academicSession?->name,
                'class_name' => $a->section?->schoolClass?->name,
                'section_name' => $a->section?->name,
                'subject_name' => $a->subject?->name,
                'subject_code' => $a->subject?->code,
            ]),
        ]);
    }

    public function edit(Teacher $teacher): Response
    {
        return Inertia::render('Admin/Teachers/Edit', [
            'teacher' => [
                'id' => $teacher->id,
                'employee_number' => $teacher->employee_number,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'email' => $teacher->email,
                'phone' => $teacher->phone,
                'qualification' => $teacher->qualification,
                'specialization' => $teacher->specialization,
                'joining_date' => $teacher->joining_date?->format('Y-m-d'),
                'status' => $teacher->status,
                'photo_url' => $teacher->photo_path ? Storage::url($teacher->photo_path) : null,
            ],
            'statusOptions' => ['active', 'inactive', 'on_leave', 'terminated'],
        ]);
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $data, $teacher) {
            $updates = collect($data)->except(['photo'])->all();

            if ($request->hasFile('photo')) {
                if ($teacher->photo_path) {
                    Storage::disk('public')->delete($teacher->photo_path);
                }
                $updates['photo_path'] = $request->file('photo')->store('teachers/photos', 'public');
            }

            $teacher->update($updates);
        });

        return redirect()
            ->back()
            ->with('success', 'Teacher updated successfully.');
    }
}
