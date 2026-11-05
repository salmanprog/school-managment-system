<?php

namespace App\Http\Requests\Admin\Attendance;

use App\Support\DefaultSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAttendanceRequest extends FormRequest
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
            'academic_session_id' => ['required', 'integer', 'exists:academic_sessions,id'],
            'class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'attendance_date' => ['required', 'date'],
            'records' => ['required', 'array', 'min:1'],
            'records.*.student_enrollment_id' => ['required', 'integer', 'exists:student_enrollments,id'],
            'records.*.status' => ['required', 'string', Rule::in(['present', 'absent', 'late'])],
            'records.*.remarks' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'records.required' => 'Select at least one student attendance status before saving.',
            'records.min' => 'Select at least one student attendance status before saving.',
            'records.*.status.required' => 'Please choose present, absent, or late for each selected student.',
        ];
    }
}
