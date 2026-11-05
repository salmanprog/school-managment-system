<?php
use App\Models\CmsModule;

use Illuminate\Support\Facades\Auth;


function dynamic_sidebar()
{
    
    $roleId = Auth::user()?->role;
    
    if (! $roleId) {
        return collect();
    }
    
    return CmsModule::with(['children' => function ($q) use ($roleId) {
            $q->whereHas('permissions', function ($perm) use ($roleId) {
                $perm->where('role', $roleId)    
                     ->where('is_view', 1);
            });
        }])
        ->where('parent_id', 0)
        ->where('status', 'active')
        ->whereHas('permissions', function ($q) use ($roleId) {
            $q->where('role', $roleId)
              ->where('is_view', 1);
        })
        ->orderBy('sort_order')
        ->get();
    
}
