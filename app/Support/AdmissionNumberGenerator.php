<?php

namespace App\Support;

use App\Models\AdmissionApplication;
use App\Models\Student;

class AdmissionNumberGenerator
{
    public static function nextAdmissionNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "ADM-{$year}-";

        $last = Student::query()
            ->where('admission_number', 'like', "{$prefix}%")
            ->orderByDesc('admission_number')
            ->value('admission_number');

        return $prefix.self::nextSequence($last);
    }

    public static function nextApplicationNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "APP-{$year}-";

        $last = AdmissionApplication::query()
            ->where('application_number', 'like', "{$prefix}%")
            ->orderByDesc('application_number')
            ->value('application_number');

        return $prefix.self::nextSequence($last);
    }

    protected static function nextSequence(?string $last): string
    {
        $sequence = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $sequence = (int) $matches[1] + 1;
        }

        return str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }
}
