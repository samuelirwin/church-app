<?php

use App\Models\Sermon;
use App\Models\SermonSeries;
use App\Models\Speaker;
use App\Models\Tag;

it('auto-generates slug from title on creation', function () {
    $sermon = Sermon::factory()->published()->create(['title' => 'Walking in Faith']);

    expect($sermon->slug)->toBe('walking-in-faith');
});

it('belongs to a speaker', function () {
    $speaker = Speaker::factory()->create();
    $sermon = Sermon::factory()->for($speaker)->published()->create();

    expect($sermon->speaker->id)->toBe($speaker->id);
});

it('optionally belongs to a series', function () {
    $series = SermonSeries::factory()->create();
    $sermon = Sermon::factory()->for($series, 'series')->published()->create();

    expect($sermon->series->id)->toBe($series->id);
});

it('casts scripture_references as array', function () {
    $refs = ['John 3:16', 'Romans 8:28'];
    $sermon = Sermon::factory()->published()->create(['scripture_references' => $refs]);

    expect($sermon->fresh()->scripture_references)->toBe($refs);
});

it('scopes to published sermons only', function () {
    Sermon::factory()->published()->create();
    Sermon::factory()->draft()->create();

    expect(Sermon::published()->count())->toBe(1);
});

it('scopes to current week sermons', function () {
    Sermon::factory()->currentWeek()->create();
    Sermon::factory()->published()->create(['is_current_week' => false]);

    expect(Sermon::currentWeek()->count())->toBe(1);
});

it('reports isPublished correctly', function () {
    $published = Sermon::factory()->published()->create();
    $draft = Sermon::factory()->draft()->create();

    expect($published->isPublished())->toBeTrue()
        ->and($draft->isPublished())->toBeFalse();
});

it('supports tags via HasTags trait', function () {
    $sermon = Sermon::factory()->published()->create();
    $sermon->syncTags(['faith', 'grace']);

    expect($sermon->tags)->toHaveCount(2)
        ->and(Tag::count())->toBe(2);
});
