<?php

namespace Database\Seeders;

use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class SchoolSetupSeeder extends Seeder
{
    public function run(): void
    {
        SchoolSetting::query()->firstOrCreate([], [
            'school_name' => 'Demo High School',
            'school_code' => 'DHS-001',
            'registration_number' => null,
            'email' => 'info@school.test',
            'phone' => '92000-000-0000',
            'address' => 'Main Campus',
            'city' => 'Lahore',
            'country' => 'Pakistan',
            'logo' => null,
            'principal_name' => 'Principal',
            'currency' => 'PKR',
            'timezone' => 'Asia/Karachi',
            'academic_year_format' => 'YYYY–YYYY',
        ]);

        $session = AcademicSession::query()->firstOrCreate(
            ['name' => '2026–2027'],
            [
                'start_date' => '2026-04-01',
                'end_date' => '2027-03-31',
                'is_current' => true,
                'status' => 'active',
            ]
        );

        if ($session->is_current) {
            AcademicSession::query()
                ->where('id', '!=', $session->id)
                ->update(['is_current' => false]);
        }

        $classNames = [
            'Nursery', 'Kindergarten',
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
            'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
        ];

        foreach ($classNames as $index => $name) {
            $class = SchoolClass::query()->firstOrCreate(
                ['code' => 'C'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT)],
                [
                    'name' => $name,
                    'sort_order' => $index + 1,
                    'status' => 'active',
                ]
            );

            foreach (['A', 'B'] as $sectionName) {
                Section::query()->firstOrCreate(
                    [
                        'class_id' => $class->id,
                        'name' => $sectionName,
                    ],
                    [
                        'capacity' => 40,
                        'status' => 'active',
                    ]
                );
            }
        }

        $subjects = [
            ['name' => 'English', 'code' => 'ENG'],
            ['name' => 'Mathematics', 'code' => 'MATH'],
            ['name' => 'Science', 'code' => 'SCI'],
            ['name' => 'Urdu', 'code' => 'URD'],
            ['name' => 'Computer Science', 'code' => 'CS'],
            ['name' => 'Social Studies', 'code' => 'SST'],
        ];

        foreach ($subjects as $subject) {
            Subject::query()->firstOrCreate(
                ['code' => $subject['code']],
                [
                    'name' => $subject['name'],
                    'description' => $subject['name'].' curriculum',
                    'status' => 'active',
                ]
            );
        }
    }
}
