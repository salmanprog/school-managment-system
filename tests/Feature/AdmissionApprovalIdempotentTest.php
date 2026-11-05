<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Services\Admissions\ApproveAdmissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SeedsAdminPermissions;
use Tests\TestCase;

class AdmissionApprovalIdempotentTest extends TestCase
{
    use RefreshDatabase;
    use SeedsAdminPermissions;

    public function test_approving_twice_returns_same_student_without_duplicates(): void
    {
        $this->createAdminUser();

        $session = AcademicSession::query()->create([
            'name' => '2026–2027',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'is_current' => true,
            'status' => 'active',
        ]);

        $class = SchoolClass::query()->create([
            'name' => 'Class 1',
            'code' => 'C01',
            'sort_order' => 1,
            'status' => 'active',
        ]);

        $section = Section::query()->create([
            'class_id' => $class->id,
            'name' => 'A',
            'capacity' => 40,
            'status' => 'active',
        ]);

        $application = AdmissionApplication::query()->create([
            'application_number' => 'APP-0001',
            'first_name' => 'Ali',
            'last_name' => 'Khan',
            'date_of_birth' => '2015-01-01',
            'gender' => 'male',
            'requested_class_id' => $class->id,
            'guardian_name' => 'Parent',
            'guardian_phone' => '03001234567',
            'application_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        $service = app(ApproveAdmissionService::class);
        $reviewerId = 1;

        $studentFirst = $service->approve($application, $section->id, $reviewerId);
        $studentSecond = $service->approve($application->fresh(), $section->id, $reviewerId);

        $this->assertSame($studentFirst->id, $studentSecond->id);
        $this->assertSame(1, Student::query()->count());
        $this->assertSame('approved', $application->fresh()->status);
        $this->assertSame($session->id, $studentFirst->enrollments()->value('academic_session_id'));
    }
}
