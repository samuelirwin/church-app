<?php

use App\Enums\HighlightType;
use App\Models\Highlight;
use App\Models\User;

it('auto-generates slug from title on creation', function () {
    $highlight = Highlight::factory()->create(['title' => 'Easter Sunday Service']);

    expect($highlight->slug)->toBe('easter-sunday-service');
});

it('belongs to an author', function () {
    $author = User::factory()->create();
    $highlight = Highlight::factory()->create(['author_id' => $author->id]);

    expect($highlight->author->id)->toBe($author->id);
});

it('casts type to HighlightType enum', function () {
    $highlight = Highlight::factory()->create(['type' => 'announcement']);

    expect($highlight->type)->toBe(HighlightType::Announcement)
        ->and($highlight->type)->toBeInstanceOf(HighlightType::class);
});

it('scopes to active highlights only', function () {
    // Active: is_active=true, started, not expired
    Highlight::factory()->create([
        'is_active' => true,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(7),
    ]);

    // Inactive by flag
    Highlight::factory()->inactive()->create();

    // Expired
    Highlight::factory()->expired()->create();

    expect(Highlight::active()->count())->toBe(1);
});

it('considers highlight with no end date as active', function () {
    Highlight::factory()->create([
        'is_active' => true,
        'starts_at' => now()->subDay(),
        'ends_at' => null,
    ]);

    expect(Highlight::active()->count())->toBe(1);
});

it('excludes future highlights from active scope', function () {
    Highlight::factory()->create([
        'is_active' => true,
        'starts_at' => now()->addDays(5),
        'ends_at' => now()->addDays(10),
    ]);

    expect(Highlight::active()->count())->toBe(0);
});

it('reports isActive correctly', function () {
    $active = Highlight::factory()->create([
        'is_active' => true,
        'starts_at' => now()->subDay(),
        'ends_at' => now()->addDays(7),
    ]);

    $inactive = Highlight::factory()->inactive()->create();
    $expired = Highlight::factory()->expired()->create();

    expect($active->isActive())->toBeTrue()
        ->and($inactive->isActive())->toBeFalse()
        ->and($expired->isActive())->toBeFalse();
});

it('casts dates correctly', function () {
    $highlight = Highlight::factory()->create();

    expect($highlight->starts_at)->toBeInstanceOf(\DateTimeInterface::class)
        ->and($highlight->ends_at)->toBeInstanceOf(\DateTimeInterface::class);
});
