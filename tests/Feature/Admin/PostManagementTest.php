<?php

use App\Models\Category;
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

describe('data table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Post::factory()->create(['title' => 'Alpha', 'created_at' => now()->subDay()]);
        Post::factory()->create(['title' => 'Omega', 'created_at' => now()->subDays(2)]);

        $this->actingAs($staff)->get(route('admin.posts.index', ['sort' => 'title', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('posts.data.0.title', 'Omega')->where('filters.sort', 'title'));

        $this->actingAs($staff)->get(route('admin.posts.index', ['sort' => 'body', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('posts.data.0.title', 'Alpha')->where('filters.sort', null));
    });

    it('filters by several categories and paginates', function () {
        $staff = User::factory()->staff()->create();
        $news = Category::factory()->create(['type' => 'post']);
        $events = Category::factory()->create(['type' => 'post']);
        Post::factory()->create(['category_id' => $news->id]);
        Post::factory()->create(['category_id' => $events->id]);
        Post::factory()->create();

        $this->actingAs($staff)
            ->get(route('admin.posts.index', ['category_id' => [$news->id, $events->id]]))
            ->assertInertia(fn ($page) => $page
                ->has('posts.data', 2)
                ->where('filters.category_id', [(string) $news->id, (string) $events->id])
                ->where('posts.meta.total', 2)
                ->has('posts.meta.links'));
    });
});
