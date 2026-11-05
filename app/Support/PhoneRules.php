<?php

namespace App\Support;

class PhoneRules
{
    public static function normalize(?string $phone): ?string
    {
        $phone = trim((string) $phone);

        return $phone === '' ? null : $phone;
    }

    /**
     * Pakistan-style masked phone: 92000-000-0000
     *
     * @return list<string>
     */
    public static function optional(): array
    {
        return ['nullable', 'string', 'max:30', 'regex:/^92\d{3}-\d{3}-\d{4}$/'];
    }

    /**
     * @return list<string>
     */
    public static function required(): array
    {
        return ['required', 'string', 'max:30', 'regex:/^92\d{3}-\d{3}-\d{4}$/'];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(string $attribute = 'phone'): array
    {
        return [
            "{$attribute}.required" => 'Please enter a phone number.',
            "{$attribute}.regex" => 'Phone must use the format 92000-000-0000 and start with 92.',
        ];
    }
}
