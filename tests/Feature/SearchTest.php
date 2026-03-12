<?php

use App\Enums\DocumentVisibility;
use App\Models\Book;
use App\Models\Course;
use App\Models\Document;
use App\Models\Event;
use App\Models\Page;
use App\Models\Post;
use App\Models\Sermon;
use App\Models\User;

it('returns matching results across models', function () {
    Sermon::factory()->create(['title' => 'Abundant Grace Teaching', 'published_at' => now()->subDay()]);
    Event::factory()->published()->create(['title' => 'Abundant Grace Conference']);
    Post::factory()->create(['title' => 'Abundant Grace in Action', 'published_at' => now()->subDay()]);
    Book::factory()->create(['title' => 'Abundant Grace Book']);

    $response = $this->getJson(route('search', ['q' => 'Abundant Grace']));

    $response->assertOk();
    $data = $response->json();

    expect($data)->toHaveKey('sermons');
    expect($data)->toHaveKey('events');
    expect($data)->toHaveKey('posts');
    expect($data)->toHaveKey('books');
    expect($data['sermons'])->toHaveCount(1);
    expect($data['events'])->toHaveCount(1);
});

it('returns validation error for short query', function () {
    $this->getJson(route('search', ['q' => 'a']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('q');
});

it('returns validation error for missing query', function () {
    $this->getJson(route('search'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('q');
});

it('groups results by model type', function () {
    Sermon::factory()->create(['title' => 'Redemption Sermon Series', 'published_at' => now()->subDay()]);
    Course::factory()->create(['title' => 'Redemption Study Course']);

    $response = $this->getJson(route('search', ['q' => 'Redemption']));

    $response->assertOk();
    $data = $response->json();

    expect($data)->toHaveKey('sermons');
    expect($data)->toHaveKey('courses');
    expect($data['sermons'][0])->toHaveKeys(['id', 'title', 'url']);
});

it('shows user results only for admin', function () {
    $admin = User::factory()->admin()->create(['name' => 'Admin Person']);
    User::factory()->create(['name' => 'Zephyr Uniquename']);

    $response = $this->actingAs($admin)->getJson(route('search', ['q' => 'Zephyr Uniquename']));

    $response->assertOk();
    expect($response->json())->toHaveKey('users');
    expect($response->json('users'))->toHaveCount(1);
});

it('hides user results from regular members', function () {
    $member = User::factory()->create();
    User::factory()->create(['name' => 'Quartzy Findable']);

    $response = $this->actingAs($member)->getJson(route('search', ['q' => 'Quartzy Findable']));

    $response->assertOk();
    expect($response->json())->not->toHaveKey('users');
});

it('respects document visibility for unauthenticated users', function () {
    Document::factory()->create(['title' => 'Searchable Public Policy', 'visibility' => DocumentVisibility::Public]);
    Document::factory()->create(['title' => 'Searchable Members Policy', 'visibility' => DocumentVisibility::Members]);
    Document::factory()->create(['title' => 'Searchable Admin Policy', 'visibility' => DocumentVisibility::Admin]);

    $response = $this->getJson(route('search', ['q' => 'Searchable']));

    $response->assertOk();
    $docs = $response->json('documents');
    expect($docs)->toHaveCount(1);
    expect($docs[0]['title'])->toBe('Searchable Public Policy');
});

it('shows members-only documents to authenticated users', function () {
    $member = User::factory()->create();
    Document::factory()->create(['title' => 'Viewable Public Doc', 'visibility' => DocumentVisibility::Public]);
    Document::factory()->create(['title' => 'Viewable Members Doc', 'visibility' => DocumentVisibility::Members]);
    Document::factory()->create(['title' => 'Viewable Admin Doc', 'visibility' => DocumentVisibility::Admin]);

    $response = $this->actingAs($member)->getJson(route('search', ['q' => 'Viewable']));

    $response->assertOk();
    $docs = $response->json('documents');
    expect($docs)->toHaveCount(2);
});

it('shows admin documents to staff users', function () {
    $staff = User::factory()->staff()->create();
    Document::factory()->create(['title' => 'Classified Report', 'visibility' => DocumentVisibility::Admin]);

    $response = $this->actingAs($staff)->getJson(route('search', ['q' => 'Classified Report']));

    $response->assertOk();
    $docs = $response->json('documents');
    expect($docs)->toHaveCount(1);
});

it('excludes unpublished content from results', function () {
    Sermon::factory()->create(['title' => 'Unpublished Draft Sermon', 'published_at' => null]);
    Sermon::factory()->create(['title' => 'Visible Published Sermon', 'published_at' => now()->subDay()]);

    $response = $this->getJson(route('search', ['q' => 'Sermon']));

    $response->assertOk();
    $sermons = $response->json('sermons');
    expect($sermons)->toHaveCount(1);
    expect($sermons[0]['title'])->toBe('Visible Published Sermon');
});

it('only shows published pages', function () {
    Page::factory()->create(['title' => 'Testpage Published', 'is_published' => true]);
    Page::factory()->create(['title' => 'Testpage Hidden', 'is_published' => false]);

    $response = $this->getJson(route('search', ['q' => 'Testpage']));

    $response->assertOk();
    $pages = $response->json('pages');
    expect($pages)->toHaveCount(1);
    expect($pages[0]['title'])->toBe('Testpage Published');
});

it('returns empty when no results match', function () {
    $response = $this->getJson(route('search', ['q' => 'xyznonexistent']));

    $response->assertOk();
    expect($response->json())->toBeEmpty();
});
