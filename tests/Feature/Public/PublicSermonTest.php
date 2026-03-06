<?php

use App\Models\Sermon;
use App\Models\SermonSeries;

it('displays the public sermons listing', function () {
    Sermon::factory()->published()->count(3)->create();

    $this->get(route('sermons.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/sermons/index')
            ->has('sermons.data', 3)
        );
});

it('only shows published sermons on public listing', function () {
    Sermon::factory()->published()->count(2)->create();
    Sermon::factory()->draft()->create();

    $this->get(route('sermons.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('sermons.data', 2)
        );
});

it('supports search on public sermons page', function () {
    Sermon::factory()->published()->create(['title' => 'Grace and Mercy']);
    Sermon::factory()->published()->create(['title' => 'Walking in Faith']);

    $this->get(route('sermons.index', ['search' => 'Grace']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('sermons.data', 1)
            ->where('sermons.data.0.title', 'Grace and Mercy')
        );
});

it('displays a published sermon detail page', function () {
    $sermon = Sermon::factory()->published()->create();

    $this->get(route('sermons.show', $sermon))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/sermons/show')
            ->has('sermon')
            ->has('relatedSermons')
        );
});

it('returns 404 for unpublished sermons', function () {
    $sermon = Sermon::factory()->draft()->create();

    $this->get(route('sermons.show', $sermon))
        ->assertNotFound();
});

it('shows related sermons from the same series', function () {
    $series = SermonSeries::factory()->create();
    $sermon = Sermon::factory()->for($series, 'series')->published()->create();
    Sermon::factory()->for($series, 'series')->published()->count(2)->create();

    $this->get(route('sermons.show', $sermon))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('relatedSermons.data', 2)
        );
});

it('filters sermons by series slug', function () {
    $series = SermonSeries::factory()->create();
    Sermon::factory()->for($series, 'series')->published()->create();
    Sermon::factory()->published()->create();

    $this->get(route('sermons.index', ['series' => $series->slug]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('sermons.data', 1)
        );
});
