<?php

use App\Models\Sermon;
use App\Models\Speaker;

it('auto-generates slug from name on creation', function () {
    $speaker = Speaker::factory()->create(['name' => 'Pastor John Smith']);

    expect($speaker->slug)->toBe('pastor-john-smith');
});

it('has sermons relationship', function () {
    $speaker = Speaker::factory()->create();
    Sermon::factory()->for($speaker)->published()->create();

    expect($speaker->sermons)->toHaveCount(1);
});

it('has photo relationship that is nullable', function () {
    $speaker = Speaker::factory()->create();

    expect($speaker->photo)->toBeNull();
});
