<?php

namespace App\Support;

use App\Enums\EntityStatus;
use App\Models\Section;

class DefaultSection
{
    /**
     * Resolve (or create) the default section for a class.
     * Class-only UX: staff never manage sections; the system keeps one per class.
     */
    public static function forClass(int $classId): Section
    {
        $existing = Section::query()
            ->where('class_id', $classId)
            ->where('status', EntityStatus::Active->value)
            ->orderBy('id')
            ->first();

        if ($existing) {
            return $existing;
        }

        $any = Section::query()
            ->where('class_id', $classId)
            ->orderBy('id')
            ->first();

        if ($any) {
            return $any;
        }

        return Section::query()->create([
            'class_id' => $classId,
            'name' => 'A',
            'capacity' => null,
            'status' => EntityStatus::Active->value,
        ]);
    }

    public static function idForClass(int $classId): int
    {
        return self::forClass($classId)->id;
    }
}
