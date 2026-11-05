<?php

namespace App\Support;

use App\Models\Teacher;

class EmployeeNumberGenerator
{
    public static function next(): string
    {
        $year = now()->format('Y');
        $prefix = "EMP-{$year}-";

        $last = Teacher::query()
            ->where('employee_number', 'like', "{$prefix}%")
            ->orderByDesc('employee_number')
            ->value('employee_number');

        $sequence = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $sequence = (int) $matches[1] + 1;
        }

        return $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }
}
