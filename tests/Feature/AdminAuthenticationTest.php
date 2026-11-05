<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\SeedsAdminPermissions;
use Tests\TestCase;

class AdminAuthenticationTest extends TestCase
{
    use RefreshDatabase;
    use SeedsAdminPermissions;

    public function test_admin_user_can_log_in_to_admin_panel(): void
    {
        $user = $this->createAdminUser([
            'email' => 'admin@test.com',
            'password' => Hash::make('secret'),
        ]);

        $response = $this->post(route('admin.login.submit'), [
            'email' => $user->email,
            'password' => 'secret',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_non_staff_user_cannot_access_admin_panel(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
            'status' => 'active',
            'password' => Hash::make('secret'),
        ]);

        $response = $this->post(route('admin.login.submit'), [
            'email' => $user->email,
            'password' => 'secret',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_inactive_admin_cannot_log_in(): void
    {
        $user = $this->createAdminUser([
            'email' => 'inactive@test.com',
            'status' => 'inactive',
            'password' => Hash::make('secret'),
        ]);

        $response = $this->post(route('admin.login.submit'), [
            'email' => $user->email,
            'password' => 'secret',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }
}
