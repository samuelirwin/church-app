<?php

use App\Jobs\MarkCurrentWeekSermon;
use App\Models\Sermon;
use Illuminate\Support\Carbon;

it('marks the most recent sunday sermon as current week', function () {
    Carbon::setTestNow(Carbon::parse('2026-02-23 Monday 09:00'));

    $sundaySermon = Sermon::factory()->published()->create([
        'sermon_date' => '2026-02-22', // previous Sunday
        'is_current_week' => false,
    ]);

    (new MarkCurrentWeekSermon)->handle();

    expect($sundaySermon->fresh()->is_current_week)->toBeTrue();

    Carbon::setTestNow();
});

it('clears the previous current week flag', function () {
    Carbon::setTestNow(Carbon::parse('2026-02-23 Monday 09:00'));

    $oldSermon = Sermon::factory()->published()->create([
        'sermon_date' => '2026-02-15',
        'is_current_week' => true,
    ]);

    $newSermon = Sermon::factory()->published()->create([
        'sermon_date' => '2026-02-22',
        'is_current_week' => false,
    ]);

    (new MarkCurrentWeekSermon)->handle();

    expect($oldSermon->fresh()->is_current_week)->toBeFalse()
        ->and($newSermon->fresh()->is_current_week)->toBeTrue();

    Carbon::setTestNow();
});

it('handles no sermons for the current week gracefully', function () {
    Carbon::setTestNow(Carbon::parse('2026-02-23 Monday 09:00'));

    $oldSermon = Sermon::factory()->published()->create([
        'sermon_date' => '2026-02-01',
        'is_current_week' => true,
    ]);

    (new MarkCurrentWeekSermon)->handle();

    expect($oldSermon->fresh()->is_current_week)->toBeFalse();

    Carbon::setTestNow();
});

it('only considers published sermons', function () {
    Carbon::setTestNow(Carbon::parse('2026-02-23 Monday 09:00'));

    $draftSermon = Sermon::factory()->draft()->create([
        'sermon_date' => '2026-02-22',
        'is_current_week' => false,
    ]);

    (new MarkCurrentWeekSermon)->handle();

    expect($draftSermon->fresh()->is_current_week)->toBeFalse();

    Carbon::setTestNow();
});
