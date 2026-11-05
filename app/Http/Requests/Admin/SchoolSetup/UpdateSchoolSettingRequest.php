<?php

namespace App\Http\Requests\Admin\SchoolSetup;

use App\Support\PhoneRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSchoolSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'phone' => PhoneRules::normalize($this->input('phone')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'school_name' => ['required', 'string', 'max:255'],
            'school_code' => ['nullable', 'string', 'max:255'],
            'registration_number' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => PhoneRules::required(),
            'address' => ['nullable', 'string', 'max:2000'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'principal_name' => ['required', 'string', 'max:255'],
            'currency' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:255'],
            'academic_year_format' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge(PhoneRules::messages('phone'), [
            'school_name.required' => 'Please enter the school name.',
            'school_name.max' => 'School name may not be greater than 255 characters.',
            'email.required' => 'Please enter the school email.',
            'email.email' => 'Please enter a valid email address.',
            'principal_name.required' => 'Please enter the principal name.',
            'logo.image' => 'Please upload a valid image file.',
            'logo.mimes' => 'Logo must be a JPG, PNG, or WEBP image.',
            'logo.max' => 'Logo size must not exceed 2MB.',
        ]);
    }
}
