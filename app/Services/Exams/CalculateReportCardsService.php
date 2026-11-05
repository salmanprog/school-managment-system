<?php

namespace App\Services\Exams;

use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\GradingScale;
use App\Models\ReportCard;
use App\Models\Section;
use App\Models\StudentEnrollment;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CalculateReportCardsService
{
    /**
     * @return array{processed: int, published: bool}
     */
    public function calculate(Exam $exam, bool $publish = false): array
    {
        $exam->load(['schedules:id,exam_id,section_id,total_marks']);

        if ($exam->schedules->isEmpty()) {
            throw new InvalidArgumentException('Exam has no schedules.');
        }

        $gradingScale = GradingScale::query()
            ->where('status', 'active')
            ->with(['items' => fn ($q) => $q->orderByDesc('minimum_percentage')])
            ->first();

        if (! $gradingScale || $gradingScale->items->isEmpty()) {
            throw new InvalidArgumentException('Configure an active grading scale before calculating results.');
        }

        $scheduleIds = $exam->schedules->pluck('id');
        $sectionIds = $exam->schedules->pluck('section_id')->unique();
        $classIds = Section::query()
            ->whereIn('id', $sectionIds)
            ->pluck('class_id')
            ->unique()
            ->filter()
            ->values();

        // Match Attendance / Marks Entry: class roster for the exam session.
        $enrollments = StudentEnrollment::query()
            ->where('academic_session_id', $exam->academic_session_id)
            ->whereIn('status', ['active', 'promoted', 'repeated'])
            ->where(function ($q) use ($sectionIds, $classIds) {
                $q->whereIn('section_id', $sectionIds);
                if ($classIds->isNotEmpty()) {
                    $q->orWhereHas('section', fn ($s) => $s->whereIn('class_id', $classIds));
                }
            })
            ->get(['id']);

        $processed = 0;

        DB::transaction(function () use ($exam, $enrollments, $scheduleIds, $gradingScale, $publish, &$processed) {
            foreach ($enrollments as $enrollment) {
                $marks = ExamMark::query()
                    ->whereIn('exam_schedule_id', $scheduleIds)
                    ->where('student_enrollment_id', $enrollment->id)
                    ->get();

                if ($marks->isEmpty()) {
                    continue;
                }

                $totalMarks = 0.0;
                $obtainedMarks = 0.0;

                foreach ($marks as $mark) {
                    $schedule = $exam->schedules->firstWhere('id', $mark->exam_schedule_id);
                    if (! $schedule) {
                        continue;
                    }

                    $totalMarks += (float) $schedule->total_marks;

                    if ($mark->attendance_status === 'absent') {
                        continue;
                    }

                    if ($mark->obtained_marks !== null) {
                        $obtainedMarks += (float) $mark->obtained_marks;
                    }
                }

                $percentage = $totalMarks > 0 ? round(($obtainedMarks / $totalMarks) * 100, 2) : 0;
                $gradeInfo = $this->resolveGrade($gradingScale, $percentage);

                $attributes = [
                    'total_marks' => round($totalMarks, 2),
                    'obtained_marks' => round($obtainedMarks, 2),
                    'percentage' => $percentage,
                    'grade' => $gradeInfo['grade'],
                    'result_status' => $gradeInfo['result_status'],
                ];

                if ($publish) {
                    $attributes['published_at'] = now();
                }

                ReportCard::query()->updateOrCreate(
                    [
                        'exam_id' => $exam->id,
                        'student_enrollment_id' => $enrollment->id,
                    ],
                    $attributes,
                );

                $processed++;
            }

            if ($publish) {
                $exam->update(['status' => 'published']);
            } else {
                $exam->update(['status' => 'completed']);
            }
        });

        return ['processed' => $processed, 'published' => $publish];
    }

    /**
     * @return array{grade: string|null, result_status: string}
     */
    protected function resolveGrade(GradingScale $scale, float $percentage): array
    {
        foreach ($scale->items as $item) {
            if ($percentage >= (float) $item->minimum_percentage && $percentage <= (float) $item->maximum_percentage) {
                $pass = $percentage >= 33;

                return [
                    'grade' => $item->grade,
                    'result_status' => $pass ? 'pass' : 'fail',
                ];
            }
        }

        return ['grade' => null, 'result_status' => 'fail'];
    }
}
