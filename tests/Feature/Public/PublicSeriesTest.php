<?php

use App\Models\Sermon;
use App\Models\SermonSeries;

it('displays the public series listing', function () {
    $series = SermonSeries::factory()->create();
    Sermon::factory()->for($series, 'series')->published()->create();

    $this->get(route('series.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/series/index')
            ->has('series.data', 1)
        );
});

it('only shows series that have sermons', function () {
    $withSermons = SermonSeries::factory()->create();
    Sermon::factory()->for($withSermons, 'series')->published()->create();

    SermonSeries::factory()->create(); // no sermons

    $this->get(route('series.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('series.data', 1)
        );
});

it('displays a series detail page with its sermons', function () {
    $series = SermonSeries::factory()->create();
    Sermon::factory()->for($series, 'series')->published()->count(3)->create();

    $this->get(route('series.show', $series))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/series/show')
            ->has('series')
            ->has('sermons.data', 3)
        );
});

it('only shows published sermons in series detail', function () {
    $series = SermonSeries::factory()->create();
    Sermon::factory()->for($series, 'series')->published()->count(2)->create();
    Sermon::factory()->for($series, 'series')->draft()->create();

    $this->get(route('series.show', $series))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('sermons.data', 2)
        );
});
