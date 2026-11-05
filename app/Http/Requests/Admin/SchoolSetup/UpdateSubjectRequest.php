<?php

namespace App\Http\Requests\Admin\SchoolSetup;

use App\Enums\EntityStatus;
use App\Models\Subject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
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
        /** @var Subject|null $subject */
        $subject = $this->route('subject');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('subjects', 'code')->ignore($subject?->id),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(EntityStatus::values())],
        ];
    }
}
