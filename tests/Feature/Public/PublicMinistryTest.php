<?php

use App\Models\Ministry;
use App\Models\MinistryGroup;

it('displays active ministries listing', function () {
    Ministry::factory()->active()->count(3)->create();
    Ministry::factory()->inactive()->create();

    $this->get(route('ministries.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/ministries/index')
            ->has('ministries.data', 3)
        );
});

it('searches ministries by name', function () {
    Ministry::factory()->active()->create(['name' => 'Youth Ministry']);
    Ministry::factory()->active()->create(['name' => 'Worship Team']);

    $this->get(route('ministries.index', ['search' => 'Youth']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('ministries.data', 1)
        );
});

it('displays an active ministry detail page', function () {
    $ministry = Ministry::factory()->active()->create();

    $this->get(route('ministries.show', $ministry->slug))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/ministries/show')
            ->has('ministry')
            ->has('groups')
        );
});

it('returns 404 for inactive ministry', function () {
    $ministry = Ministry::factory()->inactive()->create();

    $this->get(route('ministries.show', $ministry->slug))
        ->assertNotFound();
});

it('displays the group finder page', function () {
    MinistryGroup::factory()->active()->count(3)->create();
    MinistryGroup::factory()->inactive()->create();

    $this->get(route('groups.finder'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/groups/finder')
            ->has('groups.data', 3)
        );
});

it('filters groups by meeting day', function () {
    MinistryGroup::factory()->active()->create(['meeting_day' => 'Wednesday']);
    MinistryGroup::factory()->active()->create(['meeting_day' => 'Friday']);

    $this->get(route('groups.finder', ['meeting_day' => 'Wednesday']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('groups.data', 1)
        );
});
