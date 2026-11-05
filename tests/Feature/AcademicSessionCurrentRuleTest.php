<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SeedsAdminPermissions;
use Tests\TestCase;

class AcademicSessionCurrentRuleTest extends TestCase
{
    use RefreshDatabase;
    use SeedsAdminPermissions;

    public function test_setting_current_session_clears_other_current_flags(): void
    {
        $admin = $this->createAdminUser();
        $admin->givePermissionTo('sessions.manage');

        $first = AcademicSession::query()->create([
            'name' => '2025–2026',
            'start_date' => '2025-04-01',
            'end_date' => '2026-03-31',
            'is_current' => true,
            'status' => 'active',
        ]);

        $second = AcademicSession::query()->create([
            'name' => '2026–2027',
            'start_date' => '2026-04-01',
            'end_date' => '2027-03-31',
            'is_current' => false,
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.academic-sessions.set-current', $second))
            ->assertRedirect(route('admin.academic-sessions.index'));

        $this->assertFalse($first->fresh()->is_current);
        $this->assertTrue($second->fresh()->is_current);
        $this->assertSame(
            1,
            AcademicSession::query()->where('is_current', true)->count()
        );
    }
}
