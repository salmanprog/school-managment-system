<?php

namespace App\Http\Requests\Admin\SchoolSetup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClassSubjectRequest extends FormRequest
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
        return [
            'class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'subject_id' => [
                'required',
                'integer',
                'exists:subjects,id',
                Rule::unique('class_subjects')->where(fn ($query) => $query->where('class_id', $this->input('class_id'))),
            ],
            'is_compulsory' => ['nullable', 'boolean'],
        ];
    }
}
