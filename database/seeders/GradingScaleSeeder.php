<?php

namespace Database\Seeders;

use App\Models\GradingScale;
use App\Models\GradingScaleItem;
use Illuminate\Database\Seeder;

class GradingScaleSeeder extends Seeder
{
    public function run(): void
    {
        if (GradingScale::query()->exists()) {
            return;
        }

        $scale = GradingScale::query()->create([
            'name' => 'Default Scale',
            'status' => 'active',
        ]);

        $bands = [
            ['min' => 90, 'max' => 100, 'grade' => 'A+', 'gp' => 4.0],
            ['min' => 80, 'max' => 89.99, 'grade' => 'A', 'gp' => 3.5],
            ['min' => 70, 'max' => 79.99, 'grade' => 'B', 'gp' => 3.0],
            ['min' => 60, 'max' => 69.99, 'grade' => 'C', 'gp' => 2.5],
            ['min' => 50, 'max' => 59.99, 'grade' => 'D', 'gp' => 2.0],
            ['min' => 33, 'max' => 49.99, 'grade' => 'E', 'gp' => 1.0],
            ['min' => 0, 'max' => 32.99, 'grade' => 'F', 'gp' => 0.0],
        ];

        foreach ($bands as $band) {
            GradingScaleItem::query()->create([
                'grading_scale_id' => $scale->id,
                'minimum_percentage' => $band['min'],
                'maximum_percentage' => $band['max'],
                'grade' => $band['grade'],
                'grade_point' => $band['gp'],
            ]);
        }
    }
}
