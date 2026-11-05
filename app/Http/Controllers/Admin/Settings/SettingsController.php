<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        if (auth()->user()?->can('school.manage')) {
            return redirect()->route('admin.school-profile');
        }

        $setting = SchoolSetting::query()->first();

        return Inertia::render('Admin/Settings/Index', [
            'setting' => $setting ? [
                'school_name' => $setting->school_name,
                'currency' => $setting->currency,
                'timezone' => $setting->timezone,
            ] : null,
        ]);
    }
}
