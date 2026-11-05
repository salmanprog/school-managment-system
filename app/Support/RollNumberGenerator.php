<?php

namespace App\Support;

use App\Models\StudentEnrollment;

class RollNumberGenerator
{
    /**
     * Next roll number for a class section within an academic session.
     * Uses the highest existing numeric roll + 1 (defaults to "1").
     */
    public static function nextForSection(int $sectionId, int $academicSessionId): string
    {
        $rolls = StudentEnrollment::query()
            ->where('section_id', $sectionId)
            ->where('academic_session_id', $academicSessionId)
            ->whereNotNull('roll_number')
            ->pluck('roll_number');

        $max = 0;
        foreach ($rolls as $roll) {
            $value = trim((string) $roll);
            if ($value !== '' && ctype_digit($value)) {
                $max = max($max, (int) $value);
            }
        }

        return (string) ($max + 1);
    }
}
