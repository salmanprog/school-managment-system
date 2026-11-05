<?php

namespace App\Http\Requests\Admin\Admissions;

use App\Support\PhoneRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAdmissionApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'guardian_phone' => PhoneRules::normalize($this->input('guardian_phone')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'string', Rule::in(['male', 'female', 'other'])],
            'requested_class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'guardian_name' => ['required', 'string', 'max:255'],
            'guardian_phone' => PhoneRules::required(),
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'previous_school' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'application_date' => ['nullable', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge(PhoneRules::messages('guardian_phone'), [
            'first_name.required' => 'Please enter the first name.',
            'last_name.required' => 'Please enter the last name.',
            'date_of_birth.required' => 'Please select the date of birth.',
            'date_of_birth.before' => 'Date of birth must be in the past.',
            'gender.required' => 'Please select a gender.',
            'guardian_name.required' => 'Please enter the guardian name.',
            'guardian_email.email' => 'Please enter a valid guardian email.',
        ]);
    }
}
