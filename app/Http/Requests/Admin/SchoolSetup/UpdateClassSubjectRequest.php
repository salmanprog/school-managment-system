<?php

namespace App\Http\Requests\Admin\SchoolSetup;

use App\Models\ClassSubject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ClassSubject|null $classSubject */
        $classSubject = $this->route('class_subject') ?? $this->route('classSubject');

        $classId = $this->input('class_id', $classSubject?->class_id);

        return [
            'class_id' => ['sometimes', 'required', 'integer', 'exists:school_classes,id'],
            'subject_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:subjects,id',
                Rule::unique('class_subjects')
                    ->where(fn ($query) => $query->where('class_id', $classId))
                    ->ignore($classSubject?->id),
            ],
            'is_compulsory' => ['nullable', 'boolean'],
        ];
    }
}
