<?php

namespace App\Http\Requests\Admin\Students;

use App\Support\PhoneRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
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
            'admission_date' => ['required', 'date'],
            'address' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive', 'transferred', 'graduated'])],
            'photo' => ['nullable', 'image', 'max:2048'],
            'class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'academic_session_id' => ['nullable', 'integer', 'exists:academic_sessions,id'],
            'roll_number' => ['nullable', 'string', 'max:50'],
            'guardian_full_name' => ['required', 'string', 'max:255'],
            'guardian_phone' => PhoneRules::required(),
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'guardian_relationship' => ['nullable', 'string', 'max:50'],
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
            'gender.required' => 'Please select a gender.',
            'admission_date.required' => 'Please select the admission date.',
            'class_id.required' => 'Please select a class.',
            'guardian_full_name.required' => 'Please enter the guardian name.',
        ]);
    }
}
