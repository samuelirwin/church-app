<?php

use App\Models\Post;
use App\Models\User;

it('denies member access to post listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.posts.index'))
        ->assertForbidden();
});

it('allows staff to view post listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.posts.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/posts/index')
            ->has('posts')
            ->has('filters')
            ->has('categories')
        );
});

it('shows the create post form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.posts.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/posts/create')
            ->has('categories')
        );
});

it('creates a post with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.posts.store'), [
            'title' => 'Community Outreach Event',
            'body' => '<p>Join us for a day of community service.</p>',
            'published_at' => '2026-02-22 10:00',
        ])
        ->assertRedirect(route('admin.posts.index'));

    expect(Post::where('title', 'Community Outreach Event')->exists())->toBeTrue();
});

it('creates a post with tags', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.posts.store'), [
            'title' => 'Tagged Post',
            'body' => '<p>A post with tags.</p>',
            'tags' => ['community', 'outreach'],
        ])
        ->assertRedirect(route('admin.posts.index'));

    $post = Post::where('title', 'Tagged Post')->first();
    expect($post->tags)->toHaveCount(2);
});

it('validates required fields when creating a post', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.posts.store'), [])
        ->assertSessionHasErrors(['title', 'body']);
});

it('shows the edit post form', function () {
    $staff = User::factory()->staff()->create();
    $post = Post::factory()->published()->create();

    $this->actingAs($staff)
        ->get(route('admin.posts.edit', $post))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/posts/edit')
            ->has('post')
            ->has('categories')
        );
});

it('updates a post', function () {
    $staff = User::factory()->staff()->create();
    $post = Post::factory()->published()->create();

    $this->actingAs($staff)
        ->put(route('admin.posts.update', $post), [
            'title' => 'Updated Post Title',
            'body' => '<p>Updated body content.</p>',
        ])
        ->assertRedirect(route('admin.posts.index'));

    expect($post->fresh()->title)->toBe('Updated Post Title');
});

it('deletes a post', function () {
    $staff = User::factory()->staff()->create();
    $post = Post::factory()->published()->create();

    $this->actingAs($staff)
        ->delete(route('admin.posts.destroy', $post))
        ->assertRedirect(route('admin.posts.index'));

    expect(Post::find($post->id))->toBeNull();
});

it('searches posts by title', function () {
    $staff = User::factory()->staff()->create();
    Post::factory()->create(['title' => 'Easter Celebration']);
    Post::factory()->create(['title' => 'Weekly Update']);

    $this->actingAs($staff)
        ->get(route('admin.posts.index', ['search' => 'Easter']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 1)
        );
});
