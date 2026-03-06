<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

it('auto-generates slug from title on creation', function () {
    $post = Post::factory()->published()->create(['title' => 'Our Church Family Day']);

    expect($post->slug)->toBe('our-church-family-day');
});

it('belongs to an author', function () {
    $author = User::factory()->create();
    $post = Post::factory()->published()->create(['author_id' => $author->id]);

    expect($post->author->id)->toBe($author->id);
});

it('optionally belongs to a category', function () {
    $category = Category::factory()->create(['type' => 'post']);
    $post = Post::factory()->published()->create(['category_id' => $category->id]);

    expect($post->category->id)->toBe($category->id);
});

it('scopes to published posts only', function () {
    Post::factory()->published()->create();
    Post::factory()->draft()->create();

    expect(Post::published()->count())->toBe(1);
});

it('scopes to featured posts only', function () {
    Post::factory()->featured()->create();
    Post::factory()->published()->create(['is_featured' => false]);

    expect(Post::featured()->count())->toBe(1);
});

it('reports isPublished correctly', function () {
    $published = Post::factory()->published()->create();
    $draft = Post::factory()->draft()->create();

    expect($published->isPublished())->toBeTrue()
        ->and($draft->isPublished())->toBeFalse();
});

it('supports tags via HasTags trait', function () {
    $post = Post::factory()->published()->create();
    $post->syncTags(['worship', 'community']);

    expect($post->tags)->toHaveCount(2)
        ->and(Tag::count())->toBe(2);
});

it('casts is_featured as boolean', function () {
    $post = Post::factory()->featured()->create();

    expect($post->is_featured)->toBeTrue()
        ->and($post->is_featured)->toBeBool();
});
