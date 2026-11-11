<?php

use App\Actions\Fortify\CreateNewUser;
use App\Enums\MembershipStatus;
use App\Models\Household;
use App\Models\Member;
use App\Models\User;
use App\Models\Visitor;
use App\Services\MemberService;
use Database\Seeders\DemoSeeder;

it('builds a full name and age', function () {
    $member = Member::factory()->make([
        'first_name' => 'Mary',
        'last_name' => 'Magdalene',
        'date_of_birth' => now()->subYears(33)->subDay(),
    ]);

    expect($member->full_name)->toBe('Mary Magdalene')
        ->and($member->age)->toBe(33);
});

it('scopes active members', function () {
    Member::factory()->create();
    Member::factory()->regular()->create();
    Member::factory()->inactive()->create();
    Member::factory()->withStatus(MembershipStatus::Transferred)->create();

    expect(Member::active()->count())->toBe(2);
});

it('hides every member from plain members', function () {
    Member::factory()->count(2)->create();

    expect(Member::visibleTo(User::factory()->create())->count())->toBe(0);
});

describe('MemberService', function () {
    it('creates a member record when a user account is created through Fortify', function () {
        app(CreateNewUser::class)->create([
            'name' => 'Peter Rock',
            'email' => 'peter@example.com',
            'password' => 'Str0ng!Password#2026',
            'password_confirmation' => 'Str0ng!Password#2026',
        ]);

        $member = Member::where('email', 'peter@example.com')->firstOrFail();
        expect($member->user_id)->not->toBeNull()
            ->and($member->first_name)->toBe('Peter')
            ->and($member->last_name)->toBe('Rock');
    });

    it('links an existing unlinked member instead of creating a duplicate', function () {
        $existing = Member::factory()->create(['email' => 'andrew@example.com']);
        $user = User::factory()->create(['email' => 'andrew@example.com']);

        $member = app(MemberService::class)->syncFromUser($user);

        expect($member->id)->toBe($existing->id)
            ->and($member->user_id)->toBe($user->id)
            ->and(Member::count())->toBe(1);
    });

    it('returns the already linked member', function () {
        $member = Member::factory()->withUser()->create();

        expect(app(MemberService::class)->syncFromUser($member->user)->id)->toBe($member->id);
    });

    it('records status history only when the status actually changes', function () {
        $member = Member::factory()->regular()->create();
        $service = app(MemberService::class);

        $service->changeStatus($member, MembershipStatus::Regular);
        expect($member->statusChanges()->count())->toBe(0);

        $service->changeStatus($member, MembershipStatus::Member, null, 'Completed membership class');
        $change = $member->statusChanges()->first();

        expect($change->from_status)->toBe(MembershipStatus::Regular)
            ->and($change->to_status)->toBe(MembershipStatus::Member)
            ->and($change->reason)->toBe('Completed membership class');
    });

    it('creates a member when a visitor is converted', function () {
        $staff = User::factory()->staff()->create();
        $visitor = Visitor::factory()->create(['email' => 'thomas@example.com', 'phone' => '555-7777']);

        $this->actingAs($staff)->post(route('admin.visitors.convert', $visitor));

        $member = Member::where('email', 'thomas@example.com')->firstOrFail();
        expect($member->user_id)->not->toBeNull()
            ->and($member->phone)->toBe('555-7777');
    });
});

it('seeds demo members and households', function () {
    $this->seed(DemoSeeder::class);

    expect(Household::count())->toBe(4)
        ->and(Member::whereNull('user_id')->count())->toBe(5)
        ->and(Member::whereNotNull('user_id')->count())->toBe(User::count())
        ->and(Member::where('membership_status', MembershipStatus::Inactive)->count())->toBe(1);
});
