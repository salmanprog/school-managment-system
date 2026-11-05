<?php

namespace App\Http\Requests\Admin\Exams;

use Illuminate\Foundation\Http\FormRequest;

class StoreExamMarksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exam_schedule_id' => ['required', 'exists:exam_schedules,id'],
            'marks' => ['required', 'array', 'min:1'],
            'marks.*.student_enrollment_id' => ['required', 'integer', 'exists:student_enrollments,id'],
            'marks.*.attendance_status' => ['nullable', 'string', 'in:present,absent'],
            'marks.*.obtained_marks' => ['nullable', 'numeric', 'min:0'],
            'marks.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $scheduleId = (int) $this->input('exam_schedule_id');
            if (! $scheduleId) {
                return;
            }

            $totalMarks = \App\Models\ExamSchedule::query()->whereKey($scheduleId)->value('total_marks');
            if (! $totalMarks) {
                return;
            }

            foreach ($this->input('marks', []) as $index => $row) {
                $absent = ($row['attendance_status'] ?? 'present') === 'absent';
                if ($absent) {
                    continue;
                }

                $obtained = $row['obtained_marks'] ?? null;
                if ($obtained === null || $obtained === '') {
                    $validator->errors()->add("marks.{$index}.obtained_marks", 'Marks are required unless the student is absent.');

                    continue;
                }

                if ((float) $obtained > (float) $totalMarks) {
                    $validator->errors()->add("marks.{$index}.obtained_marks", "Marks cannot exceed {$totalMarks}.");
                }
            }
        });
    }
}
