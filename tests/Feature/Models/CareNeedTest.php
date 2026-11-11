<?php

use App\Enums\CareNeedStatus;
use App\Models\CareNeed;
use App\Models\Member;
use App\Models\User;
use App\Services\CareNeedService;
use Database\Seeders\DemoSeeder;
use Illuminate\Support\Facades\Notification;

it('knows when a need is overdue', function () {
    expect(CareNeed::factory()->overdue()->make()->isOverdue())->toBeTrue()
        ->and(CareNeed::factory()->overdue()->withStatus(CareNeedStatus::Resolved)->make()->isOverdue())->toBeFalse()
        ->and(CareNeed::factory()->make(['due_on' => null])->isOverdue())->toBeFalse();
});

it('uses the member name, or the typed name when there is no member', function () {
    $member = Member::factory()->create(['first_name' => 'Lydia', 'last_name' => 'Purple', 'preferred_name' => null]);

    expect(CareNeed::factory()->make(['member_id' => $member->id])->person_name)->toBe('Lydia Purple')
        ->and(CareNeed::factory()->make(['member_id' => $member->id])->prayer_wall_name)->toBe('Lydia')
        ->and(CareNeed::factory()->make(['member_id' => null, 'requester_name' => 'Simon Peter'])->prayer_wall_name)->toBe('Simon');
});

it('hides everything from plain members', function () {
    CareNeed::factory()->count(2)->create();

    expect(CareNeed::visibleTo(User::factory()->create())->count())->toBe(0);
});

it('lets the creator of a confidential need still see it', function () {
    $staff = User::factory()->staff()->create();
    CareNeed::factory()->confidential()->create(['created_by' => $staff->id]);

    expect(CareNeed::visibleTo($staff)->count())->toBe(1);
});

it('reopening a resolved need clears resolved_at', function () {
    $need = CareNeed::factory()->create();
    $service = app(CareNeedService::class);

    $service->changeStatus($need, CareNeedStatus::Resolved, null);
    expect($need->fresh()->resolved_at)->not->toBeNull();

    $service->changeStatus($need, CareNeedStatus::Open, null);
    expect($need->fresh()->resolved_at)->toBeNull();
});

it('seeds demo care needs including the absence follow-up', function () {
    Notification::fake();
    $this->seed(DemoSeeder::class);

    expect(CareNeed::count())->toBe(6)
        ->and(CareNeed::onPrayerWall()->count())->toBe(1)
        ->and(CareNeed::where('type', 'absence_follow_up')->sole()->person_name)->toBe('Lauren Harris');
});
