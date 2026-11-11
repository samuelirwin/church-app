<?php

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('login screen shows demo credentials when env is demo', function () {
    config(['app.env' => 'demo']);

    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->where('isDemo', true)
        );
});

test('login screen hides demo credentials when env is not demo', function () {
    config(['app.env' => 'local']);

    $response = $this->get(route('login'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('auth/login')
            ->where('isDemo', false)
        );
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    if (! Features::canManageTwoFactorAuthentication()) {
        $this->markTestSkipped('Two-factor authentication is not enabled.');
    }

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = User::factory()->create();

    $user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
    $response->assertRedirect(route('home'));
});

test('users are rate limited', function () {
    $user = User::factory()->create();

    RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertTooManyRequests();
});

test('admins land on the admin dashboard after logging in', function () {
    $admin = User::factory()->admin()->create();

    $this->post(route('login.store'), ['email' => $admin->email, 'password' => 'password'])
        ->assertRedirect(route('admin.dashboard', absolute: false));
});

test('staff, leaders, and members land on their member home after logging in', function (string $role) {
    $user = User::factory()->{$role}()->create();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect(route('dashboard', absolute: false));
})->with(['staff', 'leader', 'unverified']);

test('users are sent back to the page they asked for before logging in', function () {
    $admin = User::factory()->admin()->create();

    $this->get(route('admin.members.index'))->assertRedirect(route('login'));

    $this->post(route('login.store'), ['email' => $admin->email, 'password' => 'password'])
        ->assertRedirect(route('admin.members.index', absolute: false));
});
