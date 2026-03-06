<?php

use App\Enums\UserRole;

it('has the correct cases', function () {
    expect(UserRole::cases())->toHaveCount(4)
        ->and(UserRole::Admin->value)->toBe('admin')
        ->and(UserRole::Staff->value)->toBe('staff')
        ->and(UserRole::Leader->value)->toBe('leader')
        ->and(UserRole::Member->value)->toBe('member');
});

it('returns correct access levels', function (UserRole $role, int $expectedLevel) {
    expect($role->accessLevel())->toBe($expectedLevel);
})->with([
    'admin' => [UserRole::Admin, 40],
    'staff' => [UserRole::Staff, 30],
    'leader' => [UserRole::Leader, 20],
    'member' => [UserRole::Member, 10],
]);

it('compares access levels correctly', function () {
    expect(UserRole::Admin->hasAccessLevel(UserRole::Member))->toBeTrue()
        ->and(UserRole::Admin->hasAccessLevel(UserRole::Admin))->toBeTrue()
        ->and(UserRole::Member->hasAccessLevel(UserRole::Admin))->toBeFalse()
        ->and(UserRole::Staff->hasAccessLevel(UserRole::Leader))->toBeTrue()
        ->and(UserRole::Leader->hasAccessLevel(UserRole::Staff))->toBeFalse();
});

it('returns correct labels', function (UserRole $role, string $expectedLabel) {
    expect($role->label())->toBe($expectedLabel);
})->with([
    'admin' => [UserRole::Admin, 'Admin'],
    'staff' => [UserRole::Staff, 'Staff'],
    'leader' => [UserRole::Leader, 'Leader'],
    'member' => [UserRole::Member, 'Member'],
]);
