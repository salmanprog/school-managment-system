<?php

namespace App\Support;

use Illuminate\Http\Request;

class ListQuery
{
    /**
     * Safe per-page size for CRM listing tables.
     */
    public static function perPage(Request $request, int $default = 10): int
    {
        $value = (int) $request->input('per_page', $default);

        if (! in_array($value, [10, 25, 50, 100], true)) {
            return $default;
        }

        return $value;
    }

    /**
     * @param  array<string, string>  $allowed  map of request sort key => column expression
     * @return array{0: string, 1: string} [column, direction]
     */
    public static function sort(Request $request, array $allowed, string $defaultKey, string $defaultDir = 'asc'): array
    {
        $key = (string) $request->input('sort', $defaultKey);
        if (! array_key_exists($key, $allowed)) {
            $key = $defaultKey;
        }

        $dir = strtolower((string) $request->input('dir', $defaultDir)) === 'desc' ? 'desc' : 'asc';

        return [$allowed[$key], $dir, $key];
    }
}
