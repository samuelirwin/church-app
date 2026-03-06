<?php

use App\Models\Post;
use App\Models\User;

it('strips script tags from HTML fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.posts.store'), [
            'title' => 'XSS Test Post',
            'body' => '<script>alert("xss")</script><p>Safe content</p>',
            'published_at' => '2026-03-04 10:00',
        ])
        ->assertRedirect(route('admin.posts.index'));

    $post = Post::where('title', 'XSS Test Post')->first();

    expect($post)->not->toBeNull()
        ->and($post->body)->not->toContain('<script>')
        ->and($post->body)->not->toContain('alert("xss")')
        ->and($post->body)->toContain('<p>Safe content</p>');
});

it('converts empty editor output to null', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.posts.store'), [
            'title' => 'Empty Excerpt Test',
            'body' => '<p>Has body content</p>',
            'excerpt' => '<p></p>',
            'published_at' => '2026-03-04 10:00',
        ])
        ->assertRedirect(route('admin.posts.index'));

    $post = Post::where('title', 'Empty Excerpt Test')->first();

    expect($post)->not->toBeNull()
        ->and($post->excerpt)->toBeNull();
});

it('allows valid HTML through sanitization', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.posts.store'), [
            'title' => 'Valid HTML Test',
            'body' => '<p>Hello <strong>world</strong></p>',
            'published_at' => '2026-03-04 10:00',
        ])
        ->assertRedirect(route('admin.posts.index'));

    $post = Post::where('title', 'Valid HTML Test')->first();

    expect($post)->not->toBeNull()
        ->and($post->body)->toContain('<p>Hello <strong>world</strong></p>');
});
