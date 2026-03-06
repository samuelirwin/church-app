<?php

use App\Models\Sermon;
use App\Models\SermonSeries;

it('auto-generates slug from title', function () {
    $series = SermonSeries::factory()->create(['title' => 'Walk Through the Bible']);

    expect($series->slug)->toBe('walk-through-the-bible');
});

it('has sermons relationship', function () {
    $series = SermonSeries::factory()->create();
    Sermon::factory()->for($series, 'series')->published()->create();
    Sermon::factory()->for($series, 'series')->published()->create();

    expect($series->sermons)->toHaveCount(2);
});

it('scopes to active series', function () {
    SermonSeries::factory()->create(['is_active' => true]);
    SermonSeries::factory()->inactive()->create();

    expect(SermonSeries::active()->count())->toBe(1);
});

it('has nullable cover relationship', function () {
    $series = SermonSeries::factory()->create();

    expect($series->cover)->toBeNull();
});
