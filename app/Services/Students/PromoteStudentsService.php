<?php

namespace App\Services\Students;

use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Support\DefaultSection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PromoteStudentsService
{
    /**
     * @param  array<int>  $studentIds
     * @return Collection<int, StudentEnrollment>
     */
    public function process(
        array $studentIds,
        string $action,
        int $sourceSessionId,
        int $sourceClassId,
        int $targetSessionId,
        int $targetClassId,
    ): Collection {
        $studentIds = array_values(array_unique(array_map('intval', $studentIds)));

        if ($studentIds === []) {
            throw new InvalidArgumentException('Select at least one student.');
        }

        if (! in_array($action, ['promote', 'repeat', 'graduate'], true)) {
            throw new InvalidArgumentException('Invalid promotion action.');
        }

        $targetSectionId = $action === 'graduate'
            ? null
            : DefaultSection::idForClass($targetClassId);

        return DB::transaction(function () use (
            $studentIds,
            $action,
            $sourceSessionId,
            $sourceClassId,
            $targetSessionId,
            $targetSectionId,
        ) {
            $created = collect();

            foreach ($studentIds as $studentId) {
                $current = StudentEnrollment::query()
                    ->where('student_id', $studentId)
                    ->where('academic_session_id', $sourceSessionId)
                    ->where('status', 'active')
                    ->whereHas('section', fn ($s) => $s->where('class_id', $sourceClassId))
                    ->lockForUpdate()
                    ->first();

                if (! $current) {
                    throw new InvalidArgumentException("Student #{$studentId} has no active enrollment in the selected class.");
                }

                if ($action === 'graduate') {
                    $current->update(['status' => 'graduated']);
                    Student::query()->whereKey($studentId)->update(['status' => 'graduated']);

                    continue;
                }

                // Same academic session: one enrollment per student/session (unique index).
                // Promote/repeat here means move the current enrollment to the target class.
                if ($targetSessionId === $sourceSessionId) {
                    if ($current->section_id === $targetSectionId) {
                        throw new InvalidArgumentException(
                            "Student #{$studentId} is already enrolled in the selected target class."
                        );
                    }

                    $current->update([
                        'section_id' => $targetSectionId,
                        'status' => 'active',
                    ]);

                    $created->push($current->fresh());

                    continue;
                }

                $exists = StudentEnrollment::query()
                    ->where('student_id', $studentId)
                    ->where('academic_session_id', $targetSessionId)
                    ->exists();

                if ($exists) {
                    throw new InvalidArgumentException(
                        "Student #{$studentId} already has an enrollment in the target session."
                    );
                }

                $oldStatus = $action === 'repeat' ? 'repeated' : 'promoted';
                $current->update(['status' => $oldStatus]);

                $enrollment = StudentEnrollment::query()->create([
                    'student_id' => $studentId,
                    'academic_session_id' => $targetSessionId,
                    'section_id' => $targetSectionId,
                    'roll_number' => $current->roll_number,
                    'enrollment_date' => now()->toDateString(),
                    'status' => 'active',
                ]);

                $created->push($enrollment);
            }

            return $created;
        });
    }
}
