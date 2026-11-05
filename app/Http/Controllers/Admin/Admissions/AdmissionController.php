<?php

namespace App\Http\Controllers\Admin\Admissions;

use App\Enums\EntityStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Admissions\ApproveAdmissionRequest;
use App\Http\Requests\Admin\Admissions\RejectAdmissionRequest;
use App\Http\Requests\Admin\Admissions\StoreAdmissionApplicationRequest;
use App\Models\AdmissionApplication;
use App\Models\SchoolClass;
use App\Services\Admissions\ApproveAdmissionService;
use App\Support\AdmissionNumberGenerator;
use App\Support\DefaultSection;
use App\Support\ListQuery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $perPage = ListQuery::perPage($request);

        $applications = AdmissionApplication::query()
            ->with([
                'requestedClass:id,name,code',
                'reviewer:id,name',
                'student:id,admission_number,first_name,last_name',
            ])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('application_number', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('guardian_phone', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('application_date')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (AdmissionApplication $app) => [
                'id' => $app->id,
                'application_number' => $app->application_number,
                'first_name' => $app->first_name,
                'last_name' => $app->last_name,
                'full_name' => trim("{$app->first_name} {$app->last_name}"),
                'date_of_birth' => $app->date_of_birth?->format('Y-m-d'),
                'gender' => $app->gender,
                'application_date' => $app->application_date?->format('Y-m-d'),
                'status' => $app->status,
                'guardian_name' => $app->guardian_name,
                'guardian_phone' => $app->guardian_phone,
                'guardian_email' => $app->guardian_email,
                'previous_school' => $app->previous_school,
                'address' => $app->address,
                'rejection_reason' => $app->rejection_reason,
                'requested_class_id' => $app->requested_class_id,
                'requested_class' => $app->requestedClass ? [
                    'id' => $app->requestedClass->id,
                    'name' => $app->requestedClass->name,
                    'code' => $app->requestedClass->code,
                ] : null,
                'reviewer' => $app->reviewer ? ['id' => $app->reviewer->id, 'name' => $app->reviewer->name] : null,
                'reviewed_at' => $app->reviewed_at?->toIso8601String(),
                'student_id' => $app->student_id,
                'student' => $app->student ? [
                    'id' => $app->student->id,
                    'admission_number' => $app->student->admission_number,
                    'full_name' => trim("{$app->student->first_name} {$app->student->last_name}"),
                ] : null,
            ]);

        $classOptions = SchoolClass::query()
            ->where('status', EntityStatus::Active->value)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Admissions/Index', [
            'applications' => $applications,
            'classOptions' => $classOptions,
            'genderOptions' => ['male', 'female', 'other'],
            'canCreate' => $request->user()?->can('admissions.create') ?? false,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'per_page' => (string) $perPage,
            ],
            'statusOptions' => ['pending', 'approved', 'rejected'],
        ]);
    }

    public function create(): Response
    {
        $classOptions = SchoolClass::query()
            ->where('status', EntityStatus::Active->value)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Admissions/Create', [
            'classOptions' => $classOptions,
            'genderOptions' => ['male', 'female', 'other'],
        ]);
    }

    public function store(StoreAdmissionApplicationRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['application_number'] = AdmissionNumberGenerator::nextApplicationNumber();
        $data['application_date'] = $data['application_date'] ?? now()->toDateString();
        $data['status'] = 'pending';

        AdmissionApplication::query()->create($data);

        return redirect()
            ->route('admin.admissions.index')
            ->with('success', 'Admission submitted successfully.');
    }

    public function show(AdmissionApplication $admissionApplication): Response
    {
        $admissionApplication->load(['requestedClass:id,name,code', 'reviewer:id,name', 'student:id,admission_number,first_name,last_name']);

        $classOptions = SchoolClass::query()
            ->where('status', EntityStatus::Active->value)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Admissions/Show', [
            'application' => [
                'id' => $admissionApplication->id,
                'application_number' => $admissionApplication->application_number,
                'first_name' => $admissionApplication->first_name,
                'last_name' => $admissionApplication->last_name,
                'date_of_birth' => $admissionApplication->date_of_birth?->format('Y-m-d'),
                'gender' => $admissionApplication->gender,
                'requested_class_id' => $admissionApplication->requested_class_id,
                'guardian_name' => $admissionApplication->guardian_name,
                'guardian_phone' => $admissionApplication->guardian_phone,
                'guardian_email' => $admissionApplication->guardian_email,
                'previous_school' => $admissionApplication->previous_school,
                'address' => $admissionApplication->address,
                'application_date' => $admissionApplication->application_date?->format('Y-m-d'),
                'status' => $admissionApplication->status,
                'rejection_reason' => $admissionApplication->rejection_reason,
                'reviewed_at' => $admissionApplication->reviewed_at?->toIso8601String(),
                'student_id' => $admissionApplication->student_id,
                'requested_class' => $admissionApplication->requestedClass ? [
                    'id' => $admissionApplication->requestedClass->id,
                    'name' => $admissionApplication->requestedClass->name,
                    'code' => $admissionApplication->requestedClass->code,
                ] : null,
                'reviewer' => $admissionApplication->reviewer ? ['name' => $admissionApplication->reviewer->name] : null,
                'student' => $admissionApplication->student ? [
                    'id' => $admissionApplication->student->id,
                    'admission_number' => $admissionApplication->student->admission_number,
                    'full_name' => trim("{$admissionApplication->student->first_name} {$admissionApplication->student->last_name}"),
                ] : null,
            ],
            'classOptions' => $classOptions,
            'canApprove' => $admissionApplication->status === 'pending',
            'canReject' => $admissionApplication->status === 'pending',
        ]);
    }

    public function approve(
        ApproveAdmissionRequest $request,
        AdmissionApplication $admissionApplication,
        ApproveAdmissionService $service,
    ): RedirectResponse {
        try {
            $data = $request->validated();
            $classId = (int) $data['class_id'];
            $sectionId = (int) ($data['section_id'] ?? DefaultSection::idForClass($classId));

            $student = $service->approve(
                $admissionApplication,
                $sectionId,
                (int) Auth::id(),
                null,
                $data['guardian_relationship'] ?? 'parent',
            );

            return redirect()
                ->route('admin.students.show', $student)
                ->with('success', 'Admission approved and student profile created.');
        } catch (Throwable $e) {
            return redirect()
                ->route('admin.admissions.show', $admissionApplication)
                ->with('error', $e->getMessage());
        }
    }

    public function reject(RejectAdmissionRequest $request, AdmissionApplication $admissionApplication): RedirectResponse
    {
        if ($admissionApplication->status !== 'pending') {
            return redirect()
                ->route('admin.admissions.show', $admissionApplication)
                ->with('error', 'Only pending admissions can be rejected.');
        }

        $admissionApplication->update([
            'status' => 'rejected',
            'rejection_reason' => $request->validated('rejection_reason'),
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        return redirect()
            ->route('admin.admissions.index')
            ->with('success', 'Admission rejected.');
    }


}
