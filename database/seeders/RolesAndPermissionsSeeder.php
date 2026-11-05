<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guard = 'web';

        $permissions = [
            'dashboard.view',
            'school.manage',
            'sessions.manage',
            'classes.manage',
            'subjects.manage',
            'admissions.view',
            'admissions.create',
            'admissions.approve',
            'admissions.reject',
            'students.view',
            'students.create',
            'students.update',
            'students.promote',
            'teachers.manage',
            'attendance.view',
            'attendance.mark',
            'attendance.update',
            'fees.view',
            'fees.manage',
            'fees.generate-invoices',
            'fees.collect-payment',
            'fees.adjust',
            'exams.view',
            'exams.manage',
            'exams.enter-marks',
            'exams.publish',
            'reports.view',
            'users.manage',
            'roles.manage',
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, $guard);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $allNames = Permission::query()->where('guard_name', $guard)->pluck('name')->all();

        $roleMap = [
            'Super Admin' => $allNames,
            'School Admin' => $allNames,
            'Principal' => [
                'dashboard.view', 'school.manage', 'sessions.manage', 'classes.manage',
                'subjects.manage', 'admissions.view', 'admissions.approve', 'admissions.reject',
                'students.view', 'students.create', 'students.update', 'students.promote',
                'teachers.manage', 'attendance.view', 'fees.view', 'exams.view', 'exams.publish',
                'reports.view', 'settings.manage',
            ],
            'Accountant' => [
                'dashboard.view', 'fees.view', 'fees.manage', 'fees.generate-invoices',
                'fees.collect-payment', 'fees.adjust', 'reports.view', 'students.view',
            ],
            'Teacher' => [
                'dashboard.view', 'students.view', 'attendance.view', 'attendance.mark',
                'attendance.update', 'exams.view', 'exams.enter-marks',
            ],
            'Admission Officer' => [
                'dashboard.view', 'admissions.view', 'admissions.create', 'admissions.approve',
                'admissions.reject', 'students.view', 'students.create', 'students.update',
            ],
            'Receptionist' => [
                'dashboard.view', 'admissions.view', 'admissions.create', 'students.view', 'fees.view',
            ],
            'Parent' => [],
            'Student' => [],
        ];

        foreach ($roleMap as $roleName => $perms) {
            $role = Role::findOrCreate($roleName, $guard);
            $role->syncPermissions($perms);
        }

        $admin = User::query()->where('email', 'admin@admin.com')->first();
        if ($admin) {
            $admin->forceFill(['role' => 'admin'])->save();
            $admin->syncRoles(['Super Admin']);
        }
    }
}
