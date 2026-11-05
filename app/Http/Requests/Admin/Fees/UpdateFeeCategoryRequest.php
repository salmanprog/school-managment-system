<?php

namespace App\Http\Requests\Admin\Fees;

use App\Enums\EntityStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeeCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('fee_category')?->id ?? $this->route('fee_category');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('fee_categories', 'code')->ignore($id)],
            'recurrence_type' => ['required', 'string', Rule::in(['monthly', 'one_time'])],
            'status' => ['nullable', 'string', Rule::in(EntityStatus::values())],
        ];
    }
}
