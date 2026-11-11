<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

/**
 * After login (with or without two-factor), admins land in the admin area and
 * everyone else lands on their member home. If someone was sent to the login
 * page from a specific URL, they still go back there first.
 */
class LoginResponse implements LoginResponseContract, TwoFactorLoginResponseContract
{
    /**
     * @param  \Illuminate\Http\Request  $request
     */
    public function toResponse($request): Response
    {
        if ($request->wantsJson()) {
            return new JsonResponse(['two_factor' => false]);
        }

        $user = $request->user();
        $home = $user?->isAdmin() ? route('admin.dashboard') : route('dashboard');

        Log::info('User logged in', [
            'user_id' => $user?->id,
            'role' => $user?->role->value,
            'home' => $home,
        ]);

        return redirect()->intended($home);
    }
}
