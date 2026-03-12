<?php

use App\Enums\CategoryType;
use App\Models\Category;
use App\Models\Event;

it('returns events within the specified date range', function () {
    $inRange = Event::factory()->published()->create([
        'starts_at' => now()->addDays(5),
        'ends_at' => now()->addDays(5)->addHours(2),
    ]);

    $outOfRange = Event::factory()->published()->create([
        'starts_at' => now()->addMonths(3),
        'ends_at' => now()->addMonths(3)->addHours(2),
    ]);

    $response = $this->getJson(route('events.calendar-data', [
        'start' => now()->toDateString(),
        'end' => now()->addDays(30)->toDateString(),
    ]));

    $response->assertSuccessful();

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($inRange->id);
    expect($ids)->not->toContain($outOfRange->id);
});

it('filters events by category', function () {
    $category = Category::factory()->create(['type' => CategoryType::Event]);
    $matchingEvent = Event::factory()->published()->create([
        'starts_at' => now()->addDays(3),
        'category_id' => $category->id,
    ]);

    $otherEvent = Event::factory()->published()->create([
        'starts_at' => now()->addDays(3),
        'category_id' => null,
    ]);

    $response = $this->getJson(route('events.calendar-data', [
        'start' => now()->toDateString(),
        'end' => now()->addDays(30)->toDateString(),
        'category_id' => $category->id,
    ]));

    $response->assertSuccessful();

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($matchingEvent->id);
    expect($ids)->not->toContain($otherEvent->id);
});

it('only returns published events', function () {
    $published = Event::factory()->published()->create([
        'starts_at' => now()->addDays(3),
    ]);

    $draft = Event::factory()->draft()->create([
        'starts_at' => now()->addDays(3),
    ]);

    $response = $this->getJson(route('events.calendar-data', [
        'start' => now()->toDateString(),
        'end' => now()->addDays(30)->toDateString(),
    ]));

    $ids = collect($response->json('data'))->pluck('id')->all();
    expect($ids)->toContain($published->id);
    expect($ids)->not->toContain($draft->id);
});

it('returns correct JSON structure for calendar events', function () {
    $category = Category::factory()->create(['type' => CategoryType::Event, 'name' => 'Worship']);
    Event::factory()->published()->create([
        'title' => 'Sunday Service',
        'starts_at' => now()->addDays(3),
        'ends_at' => now()->addDays(3)->addHours(2),
        'is_all_day' => false,
        'location' => 'Main Hall',
        'category_id' => $category->id,
    ]);

    $response = $this->getJson(route('events.calendar-data', [
        'start' => now()->toDateString(),
        'end' => now()->addDays(30)->toDateString(),
    ]));

    $response->assertSuccessful();
    $event = $response->json('data.0');

    expect($event)
        ->toHaveKeys(['id', 'title', 'slug', 'start', 'end', 'allDay', 'category', 'location'])
        ->and($event['title'])->toBe('Sunday Service')
        ->and($event['allDay'])->toBeFalse()
        ->and($event['location'])->toBe('Main Hall')
        ->and($event['category']['name'])->toBe('Worship');
});

it('validates required date range parameters', function () {
    $this->getJson(route('events.calendar-data'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['start', 'end']);
});

it('validates end date must be after start date', function () {
    $this->getJson(route('events.calendar-data', [
        'start' => now()->addDays(10)->toDateString(),
        'end' => now()->toDateString(),
    ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['end']);
});
