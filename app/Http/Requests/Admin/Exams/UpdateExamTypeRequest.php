<?php

namespace App\Http\Requests\Admin\Exams;

use App\Enums\EntityStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExamTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('exam_type')?->id ?? $this->route('exam_type');

        return [
            'name' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(EntityStatus::values())],
        ];
    }
}
