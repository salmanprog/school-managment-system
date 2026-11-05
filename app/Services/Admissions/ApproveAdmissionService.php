<?php

namespace App\Services\Admissions;

use App\Models\AcademicSession;
use App\Models\AdmissionApplication;
use App\Models\Guardian;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGuardian;
use App\Support\AdmissionNumberGenerator;
use App\Support\RollNumberGenerator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class ApproveAdmissionService
{
    public function approve(
        AdmissionApplication $application,
        int $sectionId,
        int $reviewedBy,
        ?string $rollNumber = null,
        string $guardianRelationship = 'parent',
    ): Student {
        if ($application->status === 'approved' && $application->student_id) {
            return Student::query()->findOrFail($application->student_id);
        }

        if ($application->status === 'rejected') {
            throw new InvalidArgumentException('Cannot approve a rejected admission.');
        }

        return DB::transaction(function () use ($application, $sectionId, $reviewedBy, $rollNumber, $guardianRelationship) {
            $application = AdmissionApplication::query()->lockForUpdate()->findOrFail($application->id);

            if ($application->status === 'approved' && $application->student_id) {
                return Student::query()->findOrFail($application->student_id);
            }

            $session = AcademicSession::query()
                ->where('is_current', true)
                ->where('status', 'active')
                ->first();

            if (! $session) {
                throw new RuntimeException('No active current academic session is configured.');
            }

            $section = Section::query()->with('schoolClass')->findOrFail($sectionId);

            if ($application->requested_class_id && (int) $section->class_id !== (int) $application->requested_class_id) {
                throw new InvalidArgumentException('Selected section does not belong to the requested class.');
            }

            $student = Student::query()->create([
                'first_name' => $application->first_name,
                'last_name' => $application->last_name,
                'date_of_birth' => $application->date_of_birth,
                'gender' => $application->gender,
                'admission_date' => now()->toDateString(),
                'address' => $application->address,
                'status' => 'active',
                'admission_number' => AdmissionNumberGenerator::nextAdmissionNumber(),
            ]);

            $guardian = $this->findOrCreateGuardian($application);

            StudentGuardian::query()->create([
                'student_id' => $student->id,
                'guardian_id' => $guardian->id,
                'relationship' => $guardianRelationship,
                'is_primary' => true,
                'is_emergency_contact' => true,
            ]);

            $assignedRoll = filled($rollNumber)
                ? trim((string) $rollNumber)
                : RollNumberGenerator::nextForSection((int) $section->id, (int) $session->id);

            StudentEnrollment::query()->create([
                'student_id' => $student->id,
                'academic_session_id' => $session->id,
                'section_id' => $section->id,
                'roll_number' => $assignedRoll,
                'enrollment_date' => now()->toDateString(),
                'status' => 'active',
            ]);

            $application->update([
                'status' => 'approved',
                'reviewed_by' => $reviewedBy,
                'reviewed_at' => now(),
                'student_id' => $student->id,
            ]);

            return $student->fresh(['guardians', 'enrollments']);
        });
    }

    protected function findOrCreateGuardian(AdmissionApplication $application): Guardian
    {
        $existing = Guardian::query()
            ->where('phone', $application->guardian_phone)
            ->first();

        if ($existing) {
            return $existing;
        }

        return Guardian::query()->create([
            'full_name' => $application->guardian_name,
            'phone' => $application->guardian_phone,
            'email' => $application->guardian_email,
            'address' => $application->address,
        ]);
    }

}
