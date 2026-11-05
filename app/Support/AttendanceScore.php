<?php

namespace App\Support;

class AttendanceScore
{
    public static function weight(?string $status): float
    {
        return match ($status) {
            'present', 'late' => 1.0,
            'half_day', 'excused' => 0.5,
            default => 0.0,
        };
    }

    /**
     * @param  iterable<string>  $statuses
     */
    public static function percentageFromStatuses(iterable $statuses): ?float
    {
        $days = 0;
        $points = 0.0;

        foreach ($statuses as $status) {
            $days++;
            $points += self::weight($status);
        }

        if ($days === 0) {
            return null;
        }

        return round(($points / $days) * 100, 1);
    }
}
