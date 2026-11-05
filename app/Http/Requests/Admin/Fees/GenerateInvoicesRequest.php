<?php

namespace App\Http\Requests\Admin\Fees;

use Illuminate\Foundation\Http\FormRequest;

class GenerateInvoicesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_session_id' => ['required', 'exists:academic_sessions,id'],
            'class_id' => ['required', 'exists:school_classes,id'],
            'billing_period' => ['required', 'string', 'max:50'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:invoice_date'],
            'fee_category_ids' => ['nullable', 'array'],
            'fee_category_ids.*' => ['integer', 'exists:fee_categories,id'],
        ];
    }
}
