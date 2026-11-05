<?php

namespace App\Http\Requests\Admin\Students;

use App\Support\DefaultSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkPromotionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        $sourceClassId = $this->integer('source_class_id');
        if ($sourceClassId > 0) {
            $merge['source_section_id'] = DefaultSection::idForClass($sourceClassId);
        }

        $targetClassId = $this->integer('target_class_id');
        if ($targetClassId > 0 && $this->input('action') !== 'graduate') {
            $merge['target_section_id'] = DefaultSection::idForClass($targetClassId);
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'action' => ['required', 'string', Rule::in(['promote', 'repeat', 'graduate'])],
            'student_ids' => ['required', 'array', 'min:1'],
            'student_ids.*' => ['integer', 'exists:students,id'],
            'source_session_id' => ['required', 'integer', 'exists:academic_sessions,id'],
            'source_class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'source_section_id' => ['required', 'integer', 'exists:sections,id'],
            'target_session_id' => ['required_unless:action,graduate', 'nullable', 'integer', 'exists:academic_sessions,id'],
            'target_class_id' => ['required_unless:action,graduate', 'nullable', 'integer', 'exists:school_classes,id'],
            'target_section_id' => ['required_unless:action,graduate', 'nullable', 'integer', 'exists:sections,id'],
        ];
    }
}
