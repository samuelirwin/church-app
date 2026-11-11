<?php

use App\Enums\CareNeedStatus;
use App\Models\CareNeed;
use App\Models\CareNeedPrayer;
use App\Models\Member;
use App\Models\User;

it('shows only shared, open, recent, non-confidential requests', function () {
    $member = Member::factory()->create(['first_name' => 'Hannah', 'last_name' => 'Samuels']);
    CareNeed::factory()->onPrayerWall()->create(['member_id' => $member->id]);
    CareNeed::factory()->create();
    CareNeed::factory()->onPrayerWall()->confidential()->create();
    CareNeed::factory()->onPrayerWall()->withStatus(CareNeedStatus::Resolved)->create();
    CareNeed::factory()->onPrayerWall()->create(['created_at' => now()->subDays(CareNeed::PRAYER_WALL_DAYS + 1)]);

    $this->actingAs(User::factory()->create())
        ->get(route('prayer-wall.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/prayer-wall')
            ->has('requests.data', 1)
            ->where('requests.data.0.name', 'Hannah')
        );
});

it('records a prayer once per person', function () {
    $user = User::factory()->create();
    $need = CareNeed::factory()->onPrayerWall()->create();

    $this->actingAs($user)->post(route('prayer-wall.pray', $need))->assertRedirect();
    $this->actingAs($user)->post(route('prayer-wall.pray', $need));

    expect(CareNeedPrayer::count())->toBe(1);

    $this->actingAs($user)
        ->get(route('prayer-wall.index'))
        ->assertInertia(fn ($page) => $page
            ->where('requests.data.0.prayers_count', 1)
            ->where('requests.data.0.prayed_by_me', true)
        );
});

it('will not record prayers for needs that are not on the wall', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('prayer-wall.pray', CareNeed::factory()->create()))
        ->assertNotFound();
});

it('requires login', function () {
    $this->get(route('prayer-wall.index'))->assertRedirect(route('login'));
});
