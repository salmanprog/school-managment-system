<?php

namespace App\Http\Requests\Admin\Admissions;

use App\Support\DefaultSection;
use Illuminate\Foundation\Http\FormRequest;

class ApproveAdmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $application = $this->route('admission_application')
            ?? $this->route('admissionApplication');

        $classId = $this->integer('class_id')
            ?: (int) ($application?->requested_class_id ?? 0);

        if ($classId > 0) {
            $this->merge([
                'class_id' => $classId,
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
            'class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'roll_number' => ['nullable', 'string', 'max:50'],
            'guardian_relationship' => ['nullable', 'string', 'max:50'],
        ];
    }
}
