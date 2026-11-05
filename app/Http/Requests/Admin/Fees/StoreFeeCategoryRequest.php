<?php

namespace App\Http\Requests\Admin\Fees;

use App\Enums\EntityStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeeCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:fee_categories,code'],
            'recurrence_type' => ['required', 'string', Rule::in(['monthly', 'one_time'])],
            'status' => ['nullable', 'string', Rule::in(EntityStatus::values())],
        ];
    }
}
