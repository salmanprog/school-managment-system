<?php

namespace App\Http\Requests\Admin\Fees;

use App\Enums\EntityStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeeStructureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_session_id' => ['required', 'exists:academic_sessions,id'],
            'class_id' => [
                'required',
                'exists:school_classes,id',
                Rule::unique('fee_structures', 'class_id')
                    ->where(fn ($q) => $q
                        ->where('academic_session_id', $this->input('academic_session_id'))
                        ->whereNull('deleted_at')),
            ],
            'fee_category_id' => ['nullable', 'exists:fee_categories,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'effective_from' => ['required', 'date'],
            'status' => ['nullable', 'string', Rule::in(EntityStatus::values())],
        ];
    }

    public function messages(): array
    {
        return [
            'class_id.unique' => 'A fee amount for this class and session already exists. Edit the existing record instead.',
        ];
    }
}
