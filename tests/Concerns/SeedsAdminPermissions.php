<?php

namespace Tests\Concerns;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

trait SeedsAdminPermissions
{
    protected function seedRolesAndPermissions(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    protected function createAdminUser(array $overrides = []): User
    {
        $this->seedRolesAndPermissions();

        $user = User::factory()->create(array_merge([
            'role' => 'admin',
            'status' => 'active',
            'password' => Hash::make('password'),
        ], $overrides));

        $user->assignRole('Super Admin');

        return $user;
    }

    protected function createStaffUser(string $roleName = 'Teacher'): User
    {
        $this->seedRolesAndPermissions();

        $user = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
            'password' => Hash::make('password'),
        ]);

        Role::findByName($roleName, 'web');
        $user->assignRole($roleName);

        return $user;
    }
}
