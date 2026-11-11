<?php

use App\Enums\CareNeedSource;
use App\Models\CareNeed;
use App\Models\Household;
use App\Models\Member;
use App\Models\User;
use App\Notifications\CareNeedRequested;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => Notification::fake());

it('shows the member their own requests only', function () {
    $member = Member::factory()->withUser()->create();
    CareNeed::factory()->requestedBy($member)->create();
    CareNeed::factory()->create(['member_id' => $member->id]);
    CareNeed::factory()->create();

    $this->actingAs($member->user)
        ->get(route('my-care-needs.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/care-needs/index')
            ->has('careNeeds', 1)
            ->has('household', 1)
        );
});

it('submits a request and tells the care team', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $member = Member::factory()->withUser()->create();

    $this->actingAs($member->user)
        ->post(route('my-care-needs.store'), ['type' => 'meals', 'title' => 'Meals after surgery', 'share_on_prayer_wall' => true])
        ->assertRedirect(route('my-care-needs.index'))
        ->assertSessionHasNoErrors();

    $need = CareNeed::sole();
    expect($need->member_id)->toBe($member->id)
        ->and($need->source)->toBe(CareNeedSource::MemberRequest)
        ->and($need->share_on_prayer_wall)->toBeTrue();
    Notification::assertSentTo([$admin, $staff], CareNeedRequested::class);
});

it('keeps confidential requests off the prayer wall and away from staff', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $member = Member::factory()->withUser()->create();

    $this->actingAs($member->user)
        ->post(route('my-care-needs.store'), ['type' => 'other', 'title' => 'Private matter', 'is_confidential' => true, 'share_on_prayer_wall' => true]);

    expect(CareNeed::sole())->is_confidential->toBeTrue()->share_on_prayer_wall->toBeFalse();
    Notification::assertSentTo($admin, CareNeedRequested::class);
    Notification::assertNotSentTo($staff, CareNeedRequested::class);
});

it('lets a member ask on behalf of their household only', function () {
    $household = Household::factory()->create();
    $member = Member::factory()->withUser()->inHousehold($household)->create();
    $child = Member::factory()->child()->inHousehold($household)->create();
    $stranger = Member::factory()->create();

    $this->actingAs($member->user)
        ->post(route('my-care-needs.store'), ['member_id' => $child->id, 'type' => 'prayer', 'title' => 'Exams'])
        ->assertSessionHasNoErrors();
    $this->actingAs($member->user)
        ->post(route('my-care-needs.store'), ['member_id' => $stranger->id, 'type' => 'prayer', 'title' => 'Exams'])
        ->assertSessionHasErrors(['member_id' => 'You can only ask for help for yourself or your household.']);
});

it('validates the request form', function (array $payload, string $field) {
    $member = Member::factory()->withUser()->create();

    $this->actingAs($member->user)
        ->post(route('my-care-needs.store'), array_merge(['type' => 'prayer', 'title' => 'Exams'], $payload))
        ->assertSessionHasErrors($field);
})->with([
    'missing title' => [['title' => ''], 'title'],
    'missing type' => [['type' => ''], 'type'],
    'staff-only type' => [['type' => 'absence_follow_up'], 'type'],
]);
