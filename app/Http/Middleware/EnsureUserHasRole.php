<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     * Accepts one or more role names and grants access if the user has any of them.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            Log::warning('Unauthenticated user attempted to access role-protected route', [
                'path' => $request->path(),
            ]);

            return redirect()->route('login');
        }

        $allowedRoles = array_map(
            fn (string $role) => UserRole::from($role),
            $roles,
        );

        foreach ($allowedRoles as $allowedRole) {
            if ($user->hasRole($allowedRole)) {
                return $next($request);
            }
        }

        Log::notice('User denied access due to insufficient role', [
            'user_id' => $user->id,
            'user_role' => $user->role->value,
            'required_roles' => $roles,
            'path' => $request->path(),
        ]);

        abort(403, 'You do not have permission to access this resource.');
    }
}
