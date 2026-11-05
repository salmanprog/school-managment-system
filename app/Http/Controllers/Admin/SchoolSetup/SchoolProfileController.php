<?php

namespace App\Http\Controllers\Admin\SchoolSetup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SchoolSetup\UpdateSchoolSettingRequest;
use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SchoolProfileController extends Controller
{
    public function show(): Response
    {
        $setting = SchoolSetting::query()->firstOrCreate([], [
            'school_name' => config('app.name', 'School'),
            'currency' => 'USD',
            'timezone' => 'UTC',
        ]);

        return Inertia::render('Admin/SchoolSetup/SchoolProfile', [
            'setting' => [
                ...$setting->toArray(),
                'logo_url' => $setting->logo ? Storage::disk('public')->url($setting->logo) : null,
            ],
        ]);
    }

    public function update(UpdateSchoolSettingRequest $request): RedirectResponse
    {
        $setting = SchoolSetting::query()->firstOrCreate([], [
            'school_name' => config('app.name', 'School'),
            'currency' => 'USD',
            'timezone' => 'UTC',
        ]);

        $data = $request->safe()->except(['logo']);

        if ($request->hasFile('logo')) {
            if ($setting->logo && Storage::disk('public')->exists($setting->logo)) {
                Storage::disk('public')->delete($setting->logo);
            }

            $data['logo'] = $request->file('logo')->store('school/logos', 'public');
        }

        $setting->update($data);

        return redirect()
            ->route('admin.school-profile')
            ->with('success', 'School profile updated successfully.');
    }
}
