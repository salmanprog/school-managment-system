<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;
    use HasRoles {
        hasRole as protected spatieHasRole;
        assignRole as protected spatieAssignRole;
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function assignRole(...$roles)
    {
        return $this->spatieAssignRole(...$roles);
    }

    /**
     * Bridge legacy `role` column with Spatie roles during transition.
     */
    public function hasRole($roles, ?string $guard = null): bool
    {
        if (is_string($roles)) {
            if (($this->attributes['role'] ?? null) === $roles) {
                return true;
            }

            if ($roles === config('roles.admin', 'admin') && $this->spatieHasRole([
                'Super Admin',
                'School Admin',
                'Principal',
                'Accountant',
                'Teacher',
                'Admission Officer',
                'Receptionist',
            ], $guard)) {
                return true;
            }
        }

        return $this->spatieHasRole($roles, $guard);
    }

    public function isStaffAdmin(): bool
    {
        return $this->hasRole(config('roles.admin', 'admin'))
            || $this->spatieHasRole([
                'Super Admin',
                'School Admin',
                'Principal',
                'Accountant',
                'Teacher',
                'Admission Officer',
                'Receptionist',
            ]);
    }
}
