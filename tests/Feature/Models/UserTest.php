<?php

use App\Enums\UserRole;
use App\Models\User;

it('defaults new users to member role', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe(UserRole::Member);
});

it('can create users with specific roles', function (string $factoryState, UserRole $expectedRole) {
    $user = User::factory()->{$factoryState}()->create();

    expect($user->role)->toBe($expectedRole);
})->with([
    'admin' => ['admin', UserRole::Admin],
    'staff' => ['staff', UserRole::Staff],
    'leader' => ['leader', UserRole::Leader],
]);

it('correctly identifies admin users', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();

    expect($admin->isAdmin())->toBeTrue()
        ->and($member->isAdmin())->toBeFalse();
});

it('correctly checks staff or above', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();
    $member = User::factory()->create();

    expect($admin->isStaffOrAbove())->toBeTrue()
        ->and($staff->isStaffOrAbove())->toBeTrue()
        ->and($leader->isStaffOrAbove())->toBeFalse()
        ->and($member->isStaffOrAbove())->toBeFalse();
});

it('correctly checks leader or above', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $leader = User::factory()->leader()->create();
    $member = User::factory()->create();

    expect($admin->isLeaderOrAbove())->toBeTrue()
        ->and($staff->isLeaderOrAbove())->toBeTrue()
        ->and($leader->isLeaderOrAbove())->toBeTrue()
        ->and($member->isLeaderOrAbove())->toBeFalse();
});

it('casts role to UserRole enum', function () {
    $user = User::factory()->admin()->create();

    $freshUser = User::find($user->id);

    expect($freshUser->role)->toBeInstanceOf(UserRole::class)
        ->and($freshUser->role)->toBe(UserRole::Admin);
});
