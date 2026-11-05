<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Services\Attendance\RecordAttendanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceUpsertTest extends TestCase
{
    use RefreshDatabase;

    public function test_attendance_upsert_updates_existing_row_for_same_day(): void
    {
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

        $student = Student::query()->create([
            'first_name' => 'Sara',
            'last_name' => 'Ahmed',
            'date_of_birth' => '2014-05-05',
            'gender' => 'female',
            'admission_date' => now()->toDateString(),
            'admission_number' => 'ADM-0001',
            'status' => 'active',
        ]);

        $enrollment = StudentEnrollment::query()->create([
            'student_id' => $student->id,
            'academic_session_id' => $session->id,
            'section_id' => $section->id,
            'enrollment_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $service = app(RecordAttendanceService::class);
        $date = '2026-10-01';

        $service->upsert($session->id, $section->id, $date, [
            ['student_enrollment_id' => $enrollment->id, 'status' => 'absent'],
        ]);

        $service->upsert($session->id, $section->id, $date, [
            ['student_enrollment_id' => $enrollment->id, 'status' => 'present'],
        ]);

        $this->assertSame(1, StudentAttendance::query()->count());
        $this->assertSame('present', StudentAttendance::query()->first()->status);
    }
}
