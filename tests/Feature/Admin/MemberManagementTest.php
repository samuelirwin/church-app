<?php

use App\Enums\MembershipStatus;
use App\Models\GroupMember;
use App\Models\Household;
use App\Models\Member;
use App\Models\Ministry;
use App\Models\MinistryGroup;
use App\Models\MinistryMember;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

/**
 * Valid payload for creating a member. Override keys per test.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function memberPayload(array $overrides = []): array
{
    return array_merge([
        'first_name' => 'Ruth',
        'last_name' => 'Moabite',
        'email' => 'ruth@example.com',
        'phone' => '555-0100',
        'date_of_birth' => '1990-04-12',
        'gender' => 'female',
        'membership_status' => 'regular',
    ], $overrides);
}

describe('access', function () {
    it('denies members access to the directory', function () {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.members.index'))
            ->assertForbidden();
    });

    it('lets staff view the directory', function () {
        Member::factory()->count(3)->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.members.index'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/index')
                ->has('members.data', 3)
                ->where('canManage', true)
            );
    });

    it('only shows leaders the members of ministries and groups they lead', function () {
        $leader = User::factory()->leader()->create();
        $ministry = Ministry::factory()->create(['leader_id' => $leader->id]);
        $group = MinistryGroup::factory()->create(['leader_id' => $leader->id]);

        $inMinistry = Member::factory()->withUser()->create();
        MinistryMember::factory()->create(['ministry_id' => $ministry->id, 'user_id' => $inMinistry->user_id]);

        $inGroup = Member::factory()->withUser()->create();
        GroupMember::factory()->create(['ministry_group_id' => $group->id, 'user_id' => $inGroup->user_id]);

        $outsider = Member::factory()->withUser()->create();

        $this->actingAs($leader)
            ->get(route('admin.members.index'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('members.data', 2)
                ->where('canManage', false)
            );

        $this->actingAs($leader)->get(route('admin.members.show', $inGroup))->assertSuccessful();
        $this->actingAs($leader)->get(route('admin.members.show', $outsider))->assertForbidden();
    });

    it('blocks leaders from creating or editing members', function () {
        $leader = User::factory()->leader()->create();
        $member = Member::factory()->create();

        $this->actingAs($leader)->get(route('admin.members.create'))->assertForbidden();
        $this->actingAs($leader)->post(route('admin.members.store'), memberPayload())->assertForbidden();
        $this->actingAs($leader)->put(route('admin.members.update', $member), memberPayload())->assertForbidden();
        $this->actingAs($leader)->delete(route('admin.members.destroy', $member))->assertForbidden();
    });
});

describe('directory filters', function () {
    it('searches by name, email, and phone', function () {
        $staff = User::factory()->staff()->create();
        Member::factory()->create(['first_name' => 'Boaz', 'email' => 'boaz@example.com']);
        Member::factory()->create(['first_name' => 'Naomi', 'phone' => '999-1234']);
        Member::factory()->create(['first_name' => 'Orpah']);

        $this->actingAs($staff)->get(route('admin.members.index', ['search' => 'Boaz']))
            ->assertInertia(fn ($page) => $page->has('members.data', 1));
        $this->actingAs($staff)->get(route('admin.members.index', ['search' => '999-12']))
            ->assertInertia(fn ($page) => $page->has('members.data', 1));
    });

    it('filters by status', function () {
        $staff = User::factory()->staff()->create();
        Member::factory()->count(2)->create();
        Member::factory()->inactive()->create();

        $this->actingAs($staff)->get(route('admin.members.index', ['status' => 'inactive']))
            ->assertInertia(fn ($page) => $page->has('members.data', 1));
    });

    it('filters by age band', function (string $band, int $expected) {
        $staff = User::factory()->staff()->create();
        Member::factory()->create(['date_of_birth' => now()->subYears(8)]);
        Member::factory()->create(['date_of_birth' => now()->subYears(15)]);
        Member::factory()->create(['date_of_birth' => now()->subYears(40)]);
        Member::factory()->create(['date_of_birth' => now()->subYears(70)]);
        Member::factory()->create(['date_of_birth' => null]);

        $this->actingAs($staff)->get(route('admin.members.index', ['age_band' => $band]))
            ->assertInertia(fn ($page) => $page->has('members.data', $expected));
    })->with([
        'child' => ['child', 1],
        'youth' => ['youth', 1],
        'adult' => ['adult', 1],
        'senior' => ['senior', 1],
    ]);

    it('shows archived members only when asked', function () {
        $staff = User::factory()->staff()->create();
        Member::factory()->create();
        Member::factory()->create()->delete();

        $this->actingAs($staff)->get(route('admin.members.index'))
            ->assertInertia(fn ($page) => $page->has('members.data', 1));
        $this->actingAs($staff)->get(route('admin.members.index', ['archived' => 1]))
            ->assertInertia(fn ($page) => $page->has('members.data', 1));
    });
});

describe('create and update', function () {
    it('creates a member without a login account', function () {
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)
            ->post(route('admin.members.store'), memberPayload())
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $member = Member::where('email', 'ruth@example.com')->firstOrFail();
        expect($member->user_id)->toBeNull()
            ->and($member->membership_status)->toBe(MembershipStatus::Regular)
            ->and($member->statusChanges)->toHaveCount(1);
    });

    it('stores an uploaded photo', function () {
        Storage::fake('public');
        $staff = User::factory()->staff()->create();

        $this->actingAs($staff)
            ->post(route('admin.members.store'), memberPayload(['photo' => UploadedFile::fake()->image('ruth.jpg')]))
            ->assertSessionHasNoErrors();

        expect(Member::firstOrFail()->getFirstMedia('photo'))->not->toBeNull();
    });

    it('validates member input', function (array $payload, string $field) {
        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.members.store'), memberPayload($payload))
            ->assertSessionHasErrors($field);
    })->with([
        'missing first name' => [['first_name' => ''], 'first_name'],
        'invalid email' => [['email' => 'not-an-email'], 'email'],
        'future birth date' => [['date_of_birth' => now()->addDay()->toDateString()], 'date_of_birth'],
        'unknown gender' => [['gender' => 'unknown'], 'gender'],
        'unknown status' => [['membership_status' => 'royalty'], 'membership_status'],
        'missing status' => [['membership_status' => ''], 'membership_status'],
    ]);

    it('requires a household role when a household is chosen', function () {
        $household = Household::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.members.store'), memberPayload(['household_id' => $household->id]))
            ->assertSessionHasErrors('household_role');
    });

    it('rejects a duplicate email', function () {
        Member::factory()->create(['email' => 'ruth@example.com']);

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.members.store'), memberPayload())
            ->assertSessionHasErrors(['email' => 'Another member already uses this email address.']);
    });

    it('updates a member and records a status change', function () {
        $staff = User::factory()->staff()->create();
        $member = Member::factory()->regular()->create(['email' => 'ruth@example.com']);

        $this->actingAs($staff)
            ->put(route('admin.members.update', $member), memberPayload(['phone' => '555-9999', 'membership_status' => 'member']))
            ->assertRedirect(route('admin.members.show', $member))
            ->assertSessionHasNoErrors();

        $member->refresh();
        expect($member->phone)->toBe('555-9999')
            ->and($member->membership_status)->toBe(MembershipStatus::Member)
            ->and($member->statusChanges()->first()->changed_by)->toBe($staff->id);
    });
});

describe('profile and actions', function () {
    it('shows the profile with household and activity', function () {
        $household = Household::factory()->create();
        $member = Member::factory()->withUser()->inHousehold($household)->create();
        Member::factory()->child()->inHousehold($household)->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.members.show', $member))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/show')
                ->where('member.data.id', $member->id)
                ->has('householdMembers.data', 1)
                ->has('activity.ministries')
                ->has('activity.events')
            );
    });

    it('hides staff notes from leaders', function () {
        $leader = User::factory()->leader()->create();
        $ministry = Ministry::factory()->create(['leader_id' => $leader->id]);
        $member = Member::factory()->withUser()->create(['notes' => 'Private pastoral note']);
        MinistryMember::factory()->create(['ministry_id' => $ministry->id, 'user_id' => $member->user_id]);

        $this->actingAs($leader)
            ->get(route('admin.members.show', $member))
            ->assertInertia(fn ($page) => $page->missing('member.data.notes'));
    });

    it('changes status with a reason', function () {
        $staff = User::factory()->staff()->create();
        $member = Member::factory()->create();

        $this->actingAs($staff)
            ->patch(route('admin.members.status', $member), ['membership_status' => 'transferred', 'reason' => 'Moved away'])
            ->assertRedirect();

        expect($member->refresh()->membership_status)->toBe(MembershipStatus::Transferred)
            ->and($member->statusChanges()->first()->reason)->toBe('Moved away');
    });

    it('requires a valid status when changing status', function () {
        $this->actingAs(User::factory()->staff()->create())
            ->patch(route('admin.members.status', Member::factory()->create()), ['membership_status' => 'bogus'])
            ->assertSessionHasErrors('membership_status');
    });

    it('archives and restores a member', function () {
        $staff = User::factory()->staff()->create();
        $member = Member::factory()->create();

        $this->actingAs($staff)->delete(route('admin.members.destroy', $member))->assertRedirect(route('admin.members.index'));
        expect($member->fresh()->trashed())->toBeTrue();

        $this->actingAs($staff)->patch(route('admin.members.restore', $member->id))->assertRedirect(route('admin.members.show', $member));
        expect($member->fresh()->trashed())->toBeFalse();
    });

    it('invites a member to create an account', function () {
        Notification::fake();
        $staff = User::factory()->staff()->create();
        $member = Member::factory()->create(['email' => 'invitee@example.com']);

        $this->actingAs($staff)->post(route('admin.members.invite', $member))->assertSessionHas('success');

        $user = User::where('email', 'invitee@example.com')->firstOrFail();
        expect($member->fresh()->user_id)->toBe($user->id);
        Notification::assertSentTo($user, ResetPassword::class);
    });

    it('refuses to invite a member without an email or who already has an account', function () {
        $staff = User::factory()->staff()->create();
        $noEmail = Member::factory()->create(['email' => null]);
        $linked = Member::factory()->withUser()->create();

        $this->actingAs($staff)->post(route('admin.members.invite', $noEmail))->assertSessionHas('error');
        $this->actingAs($staff)->post(route('admin.members.invite', $linked))->assertSessionHas('info');

        expect($noEmail->fresh()->user_id)->toBeNull();
    });

    it('exports members as csv', function () {
        Member::factory()->count(2)->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.exports.members'))
            ->assertSuccessful()
            ->assertDownload('members.csv');
    });
});

describe('data table', function () {
    it('sorts by name in either direction and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Member::factory()->create(['first_name' => 'Anna', 'last_name' => 'Adams']);
        Member::factory()->create(['first_name' => 'Zack', 'last_name' => 'Zimmer']);

        $this->actingAs($staff)->get(route('admin.members.index', ['sort' => 'name', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->where('members.data.0.last_name', 'Zimmer')
                ->where('filters.sort', 'name')
                ->where('filters.direction', 'desc'));

        $this->actingAs($staff)->get(route('admin.members.index', ['sort' => 'password; drop table members', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->where('members.data.0.last_name', 'Adams')
                ->where('filters.sort', null));
    });

    it('sorts by age with the youngest first when ascending', function () {
        Member::factory()->create(['first_name' => 'Old', 'date_of_birth' => now()->subYears(70)]);
        Member::factory()->create(['first_name' => 'Young', 'date_of_birth' => now()->subYears(20)]);

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.members.index', ['sort' => 'age', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page->where('members.data.0.first_name', 'Young'));
    });

    it('filters by several statuses and age bands at once', function () {
        $staff = User::factory()->staff()->create();
        Member::factory()->create(['date_of_birth' => now()->subYears(40)]);
        Member::factory()->regular()->create(['date_of_birth' => now()->subYears(8)]);
        Member::factory()->inactive()->create(['date_of_birth' => now()->subYears(40)]);

        $this->actingAs($staff)->get(route('admin.members.index', ['status' => ['member', 'regular']]))
            ->assertInertia(fn ($page) => $page->has('members.data', 2)->where('filters.status', ['member', 'regular']));

        $this->actingAs($staff)->get(route('admin.members.index', ['age_band' => ['child', 'senior']]))
            ->assertInertia(fn ($page) => $page->has('members.data', 1));
    });

    it('changes the status of several members and records each change', function () {
        $staff = User::factory()->staff()->create();
        $members = Member::factory()->count(3)->regular()->create();

        $this->actingAs($staff)
            ->post(route('admin.members.bulk.status'), ['member_ids' => $members->modelKeys(), 'membership_status' => 'member'])
            ->assertSessionHas('success', 'Status set to Member for 3 members.');

        foreach ($members as $member) {
            expect($member->fresh()->membership_status->value)->toBe('member')
                ->and($member->statusChanges()->where('changed_by', $staff->id)->exists())->toBeTrue();
        }
    });

    it('archives several members at once', function () {
        $members = Member::factory()->count(2)->create();
        $keep = Member::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.members.bulk.archive'), ['member_ids' => $members->modelKeys()])
            ->assertSessionHas('success', '2 members archived.');

        expect(Member::count())->toBe(1)->and(Member::first()->id)->toBe($keep->id);
    });

    it('validates bulk actions and blocks leaders', function () {
        $member = Member::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.members.bulk.status'), ['member_ids' => [], 'membership_status' => 'royalty'])
            ->assertSessionHasErrors(['member_ids', 'membership_status']);

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.members.bulk.archive'), ['member_ids' => [999999]])
            ->assertSessionHasErrors('member_ids.0');

        $this->actingAs(User::factory()->leader()->create())
            ->post(route('admin.members.bulk.archive'), ['member_ids' => [$member->id]])
            ->assertForbidden();
    });
});
