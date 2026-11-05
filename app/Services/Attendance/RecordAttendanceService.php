<?php

namespace App\Services\Attendance;

use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RecordAttendanceService
{
    /**
     * Create attendance only for students that do not already have a record for the date.
     * Existing records cannot be updated.
     *
     * @param  array<int, array{student_enrollment_id: int, status: string, remarks?: string|null}>  $records
     */
    public function upsert(
        int $academicSessionId,
        int $classId,
        string $attendanceDate,
        array $records,
        ?int $markedBy = null,
    ): int {
        $enrollmentIds = collect($records)->pluck('student_enrollment_id')->map(fn ($id) => (int) $id)->unique()->values();

        if ($enrollmentIds->isEmpty()) {
            throw new InvalidArgumentException('Select at least one student attendance status before saving.');
        }

        $validEnrollments = StudentEnrollment::query()
            ->whereIn('id', $enrollmentIds)
            ->where('academic_session_id', $academicSessionId)
            ->whereIn('status', ['active', 'promoted', 'repeated'])
            ->whereHas('section', fn ($s) => $s->where('class_id', $classId))
            ->pluck('id');

        if ($validEnrollments->count() !== $enrollmentIds->count()) {
            throw new InvalidArgumentException('One or more enrollments do not belong to the selected session and class.');
        }

        $dateKey = Carbon::parse($attendanceDate)->toDateString();

        $alreadyMarkedIds = StudentAttendance::query()
            ->whereDate('attendance_date', $dateKey)
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->pluck('student_enrollment_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($alreadyMarkedIds !== []) {
            throw new InvalidArgumentException(
                'Attendance for one or more selected students is already saved and cannot be changed.'
            );
        }

        return DB::transaction(function () use ($records, $dateKey, $markedBy) {
            $saved = 0;

            foreach ($records as $row) {
                if (empty($row['status'])) {
                    continue;
                }

                StudentAttendance::query()->create([
                    'student_enrollment_id' => $row['student_enrollment_id'],
                    'attendance_date' => $dateKey,
                    'status' => $row['status'],
                    'remarks' => $row['remarks'] ?? null,
                    'marked_by' => $markedBy,
                ]);
                $saved++;
            }

            if ($saved === 0) {
                throw new InvalidArgumentException('Select at least one student attendance status before saving.');
            }

            return $saved;
        });
    }
}
