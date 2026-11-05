<?php

namespace App\Http\Requests\Admin\Teachers;

use App\Support\DefaultSection;
use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherAssignmentRequest extends FormRequest
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

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'integer', 'exists:teachers,id'],
            'academic_session_id' => ['required', 'integer', 'exists:academic_sessions,id'],
            'class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'subject_id' => ['required', 'integer', 'exists:subjects,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $exists = \App\Models\TeacherAssignment::query()
                ->where('teacher_id', $this->integer('teacher_id'))
                ->where('academic_session_id', $this->integer('academic_session_id'))
                ->where('section_id', $this->integer('section_id'))
                ->where('subject_id', $this->integer('subject_id'))
                ->exists();

            if ($exists) {
                $validator->errors()->add('teacher_id', 'This teacher is already assigned to this class and subject for the selected session.');
            }
        });
    }
}
