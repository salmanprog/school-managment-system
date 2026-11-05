<?php

namespace App\Http\Middleware;

use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $currentSession = null;
        try {
            $currentSession = AcademicSession::query()
                ->where('is_current', true)
                ->where('status', 'active')
                ->first(['id', 'name', 'start_date', 'end_date']);
        } catch (\Throwable) {
            $currentSession = null;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames()->values(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'print_receipt_id' => fn () => $request->session()->get('print_receipt_id'),
            ],
            'currentAcademicSession' => $currentSession,
            'schoolName' => config('app.name', 'School Management System'),
        ];
    }
}
