<?php

namespace App\Http\Requests\Admin\Fees;

use Illuminate\Foundation\Http\FormRequest;

class CollectPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'max:50'],
            'transaction_reference' => ['nullable', 'string', 'max:255'],
            // Optional — when empty, payment is auto-applied to pending fees.
            'allocations' => ['nullable', 'array'],
            'allocations.*.fee_invoice_id' => ['required_with:allocations', 'integer', 'exists:fee_invoices,id'],
            'allocations.*.allocated_amount' => ['required_with:allocations', 'numeric', 'min:0.01'],
        ];
    }
}
