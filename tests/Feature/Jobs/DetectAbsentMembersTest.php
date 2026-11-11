<?php

use App\Enums\CareNeedSource;
use App\Enums\CareNeedType;
use App\Jobs\DetectAbsentMembers;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\CareNeed;
use App\Models\Member;
use App\Models\ServiceTime;
use App\Models\SiteSetting;
use App\Models\User;
use App\Notifications\AbsentMembersDetected;
use Illuminate\Support\Facades\Notification;

/**
 * Create one service session per week, oldest first, and return them.
 *
 * @return array<int, AttendanceSession>
 */
function weeklyServices(int $weeks): array
{
    $serviceTime = ServiceTime::factory()->create();

    return collect(range($weeks, 1))
        ->map(fn (int $weeksAgo) => AttendanceSession::factory()
            ->forService($serviceTime)
            ->on(now()->subWeeks($weeksAgo)->toDateString())
            ->create())
        ->all();
}

function attended(Member $member, AttendanceSession $session): void
{
    AttendanceRecord::factory()->create(['attendance_session_id' => $session->id, 'member_id' => $member->id]);
}

beforeEach(function () {
    Notification::fake();
    $this->staff = User::factory()->staff()->create();
});

it('flags a member who missed the last three services', function () {
    $sessions = weeklyServices(5);
    $lapsed = Member::factory()->create();
    attended($lapsed, $sessions[0]);
    attended($lapsed, $sessions[1]);

    $regular = Member::factory()->create();
    attended($regular, $sessions[4]);

    dispatch_sync(new DetectAbsentMembers);

    Notification::assertSentTo($this->staff, AbsentMembersDetected::class, function ($notification) use ($lapsed) {
        return $notification->toArray($this->staff)['member_ids'] === [$lapsed->id];
    });
    expect($lapsed->fresh()->absence_alerted_at)->not->toBeNull()
        ->and($regular->fresh()->absence_alerted_at)->toBeNull();
});

it('does nothing until enough services have been recorded', function () {
    $sessions = weeklyServices(2);
    attended(Member::factory()->create(), $sessions[0]);

    dispatch_sync(new DetectAbsentMembers);

    Notification::assertNothingSent();
});

it('ignores members who have never been checked in', function () {
    weeklyServices(4);
    Member::factory()->create();

    dispatch_sync(new DetectAbsentMembers);

    Notification::assertNothingSent();
});

it('ignores inactive members and treats excused as attending', function () {
    $sessions = weeklyServices(4);
    $inactive = Member::factory()->inactive()->create();
    attended($inactive, $sessions[0]);

    $excused = Member::factory()->create();
    attended($excused, $sessions[0]);
    AttendanceRecord::factory()->excused()->create(['attendance_session_id' => $sessions[3]->id, 'member_id' => $excused->id]);

    dispatch_sync(new DetectAbsentMembers);

    Notification::assertNothingSent();
});

it('alerts only once per absence streak', function () {
    $sessions = weeklyServices(4);
    $lapsed = Member::factory()->create();
    attended($lapsed, $sessions[0]);

    dispatch_sync(new DetectAbsentMembers);
    dispatch_sync(new DetectAbsentMembers);

    Notification::assertSentToTimes($this->staff, AbsentMembersDetected::class, 1);
});

it('respects the configured threshold', function () {
    SiteSetting::setValue('attendance', 'absence_threshold', '5');
    $sessions = weeklyServices(4);
    attended(Member::factory()->create(), $sessions[0]);

    dispatch_sync(new DetectAbsentMembers);

    Notification::assertNothingSent();
});

it('does not notify plain members or leaders', function () {
    $member = User::factory()->create();
    $leader = User::factory()->leader()->create();
    $sessions = weeklyServices(4);
    attended(Member::factory()->create(), $sessions[0]);

    dispatch_sync(new DetectAbsentMembers);

    Notification::assertNotSentTo([$member, $leader], AbsentMembersDetected::class);
});

it('opens one absence follow-up care need per flagged member', function () {
    $sessions = weeklyServices(4);
    $lapsed = Member::factory()->create();
    attended($lapsed, $sessions[0]);

    dispatch_sync(new DetectAbsentMembers);

    $need = $lapsed->careNeeds()->sole();
    expect($need->type)->toBe(CareNeedType::AbsenceFollowUp)
        ->and($need->source)->toBe(CareNeedSource::Absence)
        ->and($need->due_on->toDateString())->toBe(now()->addWeek()->toDateString());
});

it('does not open a second follow-up while one is still open', function () {
    $sessions = weeklyServices(4);
    $lapsed = Member::factory()->create();
    attended($lapsed, $sessions[0]);
    CareNeed::factory()->ofType(CareNeedType::AbsenceFollowUp)->create(['member_id' => $lapsed->id]);

    dispatch_sync(new DetectAbsentMembers);

    expect($lapsed->careNeeds()->count())->toBe(1);
});
