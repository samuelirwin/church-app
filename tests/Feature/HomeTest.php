<?php

use App\Models\Course;
use App\Models\Highlight;
use App\Models\Post;
use App\Models\Sermon;
use App\Models\Speaker;

it('displays the landing page', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('currentSermon')
            ->has('highlights')
            ->has('recentPosts')
            ->has('featuredCourses')
        );
});

it('passes current week sermon when one exists', function () {
    $speaker = Speaker::factory()->create();
    Sermon::factory()->currentWeek()->create([
        'title' => 'This Week Sermon',
        'speaker_id' => $speaker->id,
    ]);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('currentSermon.title', 'This Week Sermon')
            ->where('currentSermon.is_current_week', true)
        );
});

it('falls back to latest published sermon when no current week', function () {
    $speaker = Speaker::factory()->create();
    Sermon::factory()->published()->create([
        'title' => 'Older Sermon',
        'speaker_id' => $speaker->id,
        'sermon_date' => now()->subWeeks(2),
    ]);
    Sermon::factory()->published()->create([
        'title' => 'Latest Sermon',
        'speaker_id' => $speaker->id,
        'sermon_date' => now()->subDay(),
    ]);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('currentSermon.title', 'Latest Sermon')
        );
});

it('returns null for current sermon when none exist', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('currentSermon', null)
        );
});

it('passes active highlights ordered by priority', function () {
    Highlight::factory()->create(['title' => 'Second', 'priority' => 2]);
    Highlight::factory()->create(['title' => 'First', 'priority' => 1]);
    Highlight::factory()->inactive()->create(['title' => 'Inactive']);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('highlights.data', 2)
            ->where('highlights.data.0.title', 'First')
            ->where('highlights.data.1.title', 'Second')
        );
});

it('excludes expired highlights', function () {
    Highlight::factory()->create(['title' => 'Active']);
    Highlight::factory()->expired()->create(['title' => 'Expired']);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('highlights.data', 1)
            ->where('highlights.data.0.title', 'Active')
        );
});

it('passes recent published posts', function () {
    Post::factory()->published()->create(['title' => 'Published Post']);
    Post::factory()->draft()->create(['title' => 'Draft Post']);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('recentPosts.data', 1)
            ->where('recentPosts.data.0.title', 'Published Post')
        );
});

it('limits posts to 3', function () {
    Post::factory()->published()->count(5)->create();

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('recentPosts.data', 3)
        );
});

it('passes published courses and limits to 3', function () {
    Course::factory()->published()->count(5)->create();
    Course::factory()->unpublished()->create();

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('featuredCourses.data', 3)
        );
});

it('limits highlights to 3', function () {
    Highlight::factory()->count(5)->create();

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('highlights.data', 3)
        );
});
