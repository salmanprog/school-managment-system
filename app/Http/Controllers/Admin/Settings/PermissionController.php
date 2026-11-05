<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(): Response
    {
        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->pluck('name')
            ->values();

        $grouped = $permissions
            ->groupBy(fn (string $name) => explode('.', $name, 2)[0] ?? 'other')
            ->map(fn ($items, $group) => [
                'group' => $group,
                'permissions' => $items->sort()->values(),
            ])
            ->sortBy('group')
            ->values();

        return Inertia::render('Admin/Settings/Permissions/Index', [
            'groupedPermissions' => $grouped,
            'total' => $permissions->count(),
        ]);
    }
}
