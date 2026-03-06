<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureGates();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    /**
     * Configure authorization gates for role-based access control.
     */
    protected function configureGates(): void
    {
        Gate::define('manage-system', function (User $user): bool {
            $allowed = $user->isAdmin();

            if (! $allowed) {
                Log::debug('Gate manage-system denied', ['user_id' => $user->id, 'role' => $user->role->value]);
            }

            return $allowed;
        });

        Gate::define('manage-content', function (User $user): bool {
            return $user->isStaffOrAbove();
        });

        Gate::define('manage-groups', function (User $user): bool {
            return $user->isLeaderOrAbove();
        });

        Gate::define('view-admin', function (User $user): bool {
            return $user->isLeaderOrAbove();
        });
    }
}
