<?php

namespace App\Http\Requests\Admin\SchoolSetup;

use App\Enums\EntityStatus;
use App\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolClassRequest extends FormRequest
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
        /** @var SchoolClass|null $schoolClass */
        $schoolClass = $this->route('school_class') ?? $this->route('schoolClass');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('school_classes', 'code')->ignore($schoolClass?->id),
            ],
            'status' => ['nullable', 'string', Rule::in(EntityStatus::values())],
            'subject_ids' => ['nullable', 'array'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
        ];
    }
}
