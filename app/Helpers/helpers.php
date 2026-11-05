<?php

use Illuminate\Support\Facades\Auth;

if (!function_exists('checkUser')) {
    function checkUser()
    {
        return Auth::user();
    }
}

if (! function_exists('formatRole')) {
    function formatRole($roleName)
    {
        return \Illuminate\Support\Str::of($roleName ?? 'Not Set')->replace('_', ' ')->title();
    }
}

if (! function_exists('isRole')) {
    function isRole($role)
    {
        $user = Auth::user();
        if (!$user) return false;

        $userRole = $user->roles->first();

        if (!$userRole) return false;

        // If role passed is numeric → check id
        if (is_numeric($role)) {
            return $userRole->id == $role;
        }

        // If string → check role name
        return $userRole->name === $role;
    }
}

function generateRandomPassword($length = 10)
{
    return substr(str_shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'), 0, $length);
}


if (!function_exists('userRoleId')) {
    function userRoleId()
    {
        return auth()->check() ? auth()->user()->roles->first()->id : null;
    }
}

if (!function_exists('userHasRole')) {
    function userHasRole($roleName)
    {
        return auth()->check() && auth()->user()->hasRole($roleName);
    }
}

if (!function_exists('current_user')) {
    function current_user() {
        return \Illuminate\Support\Facades\Auth::user();
    }
}
