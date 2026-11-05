<?php

namespace App\Http\Requests\Admin\Exams;

use App\Support\DefaultSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $classId = $this->integer('class_id');
        if ($classId > 0) {
            $this->merge([
                'section_id' => DefaultSection::idForClass($classId),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'exam_id' => ['required', 'exists:exams,id'],
            'class_id' => ['required', 'exists:school_classes,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'subject_id' => [
                'required',
                'exists:subjects,id',
                Rule::exists('class_subjects', 'subject_id')
                    ->where(fn ($q) => $q->where('class_id', $this->input('class_id'))),
                Rule::unique('exam_schedules', 'subject_id')
                    ->where(fn ($q) => $q
                        ->where('exam_id', $this->input('exam_id'))
                        ->where('section_id', $this->input('section_id'))
                        ->whereNull('deleted_at')),
            ],
            'exam_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'total_marks' => ['required', 'integer', 'min:1'],
            'passing_marks' => ['required', 'integer', 'min:0', 'lte:total_marks'],
        ];
    }

    public function messages(): array
    {
        return [
            'subject_id.exists' => 'Select a subject that is assigned to this class.',
            'subject_id.unique' => 'A schedule for this exam, class, and subject already exists. Edit the existing one instead.',
        ];
    }
}
