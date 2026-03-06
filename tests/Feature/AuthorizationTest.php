<?php

use App\Models\User;
use Illuminate\Support\Facades\Gate;

it('grants manage-system to admin only', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $member = User::factory()->create();

    expect(Gate::forUser($admin)->allows('manage-system'))->toBeTrue()
        ->and(Gate::forUser($staff)->allows('manage-system'))->toBeFalse()
        ->and(Gate::forUser($member)->allows('manage-system'))->toBeFalse();
});

it('grants manage-content to admin and staff', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();
    $member = User::factory()->create();

    expect(Gate::forUser($admin)->allows('manage-content'))->toBeTrue()
        ->and(Gate::forUser($staff)->allows('manage-content'))->toBeTrue()
        ->and(Gate::forUser($leader)->allows('manage-content'))->toBeFalse()
        ->and(Gate::forUser($member)->allows('manage-content'))->toBeFalse();
});

it('grants manage-groups to admin, staff, and leader', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();
    $member = User::factory()->create();

    expect(Gate::forUser($admin)->allows('manage-groups'))->toBeTrue()
        ->and(Gate::forUser($staff)->allows('manage-groups'))->toBeTrue()
        ->and(Gate::forUser($leader)->allows('manage-groups'))->toBeTrue()
        ->and(Gate::forUser($member)->allows('manage-groups'))->toBeFalse();
});

it('grants view-admin to admin, staff, and leader', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();
    $member = User::factory()->create();

    expect(Gate::forUser($admin)->allows('view-admin'))->toBeTrue()
        ->and(Gate::forUser($staff)->allows('view-admin'))->toBeTrue()
        ->and(Gate::forUser($leader)->allows('view-admin'))->toBeTrue()
        ->and(Gate::forUser($member)->allows('view-admin'))->toBeFalse();
});
