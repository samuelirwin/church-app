<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['web', 'role:admin'])->get('/test-admin-only', fn () => 'ok');
    Route::middleware(['web', 'role:admin,staff'])->get('/test-admin-staff', fn () => 'ok');
    Route::middleware(['web', 'role:admin,staff,leader'])->get('/test-leader-up', fn () => 'ok');
});

it('redirects guests to login', function () {
    $this->get('/test-admin-only')
        ->assertRedirect(route('login'));
});

it('allows admin access to admin-only routes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get('/test-admin-only')
        ->assertSuccessful();
});

it('denies member access to admin-only routes', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get('/test-admin-only')
        ->assertForbidden();
});

it('allows staff access to admin+staff routes', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get('/test-admin-staff')
        ->assertSuccessful();
});

it('denies leader access to admin+staff routes', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get('/test-admin-staff')
        ->assertForbidden();
});

it('allows leader access to leader-up routes', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get('/test-leader-up')
        ->assertSuccessful();
});

it('denies member access to leader-up routes', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get('/test-leader-up')
        ->assertForbidden();
});
