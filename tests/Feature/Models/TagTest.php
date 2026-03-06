<?php

use App\Models\Tag;

it('creates a tag with auto-generated slug', function () {
    $tag = Tag::findOrCreate('Prayer');

    expect($tag->name)->toBe('Prayer')
        ->and($tag->slug)->toBe('prayer');
});

it('finds existing tag instead of creating duplicate', function () {
    $tag1 = Tag::findOrCreate('Worship');
    $tag2 = Tag::findOrCreate('Worship');

    expect($tag1->id)->toBe($tag2->id)
        ->and(Tag::count())->toBe(1);
});

it('creates tag via factory', function () {
    $tag = Tag::factory()->create();

    expect($tag)->toBeInstanceOf(Tag::class)
        ->and($tag->name)->toBeString()
        ->and($tag->slug)->toBeString();
});

it('supports finding tags containing a search term', function () {
    Tag::findOrCreate('Grace');
    Tag::findOrCreate('Amazing Grace');
    Tag::findOrCreate('Faith');

    $results = Tag::containing('grace')->get();

    expect($results)->toHaveCount(2);
});
