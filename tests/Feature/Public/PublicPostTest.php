<?php

use App\Models\Category;
use App\Models\Post;

it('displays the public updates listing', function () {
    Post::factory()->published()->count(3)->create();

    $this->get(route('posts.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/updates/index')
            ->has('posts.data', 3)
        );
});

it('only shows published posts on public listing', function () {
    Post::factory()->published()->count(2)->create();
    Post::factory()->draft()->create();

    $this->get(route('posts.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 2)
        );
});

it('supports search on public updates page', function () {
    Post::factory()->published()->create(['title' => 'Easter Celebration']);
    Post::factory()->published()->create(['title' => 'Weekly Digest']);

    $this->get(route('posts.index', ['search' => 'Easter']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 1)
            ->where('posts.data.0.title', 'Easter Celebration')
        );
});

it('filters posts by category slug', function () {
    $category = Category::factory()->create(['type' => 'post']);
    Post::factory()->published()->create(['category_id' => $category->id]);
    Post::factory()->published()->create();

    $this->get(route('posts.index', ['category' => $category->slug]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 1)
        );
});

it('displays a published post detail page', function () {
    $post = Post::factory()->published()->create();

    $this->get(route('posts.show', $post))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/updates/show')
            ->has('post')
            ->has('relatedPosts')
        );
});

it('returns 404 for unpublished posts', function () {
    $post = Post::factory()->draft()->create();

    $this->get(route('posts.show', $post))
        ->assertNotFound();
});

it('shows related posts from the same category', function () {
    $category = Category::factory()->create(['type' => 'post']);
    $post = Post::factory()->published()->create(['category_id' => $category->id]);
    Post::factory()->published()->count(2)->create(['category_id' => $category->id]);

    $this->get(route('posts.show', $post))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('relatedPosts.data', 2)
        );
});
