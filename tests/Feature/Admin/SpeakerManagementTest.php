<?php

use App\Models\Speaker;
use App\Models\User;

it('denies member access to speakers listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.speakers.index'))
        ->assertForbidden();
});

it('allows staff to view speakers listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.speakers.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/speakers/index')
            ->has('speakers')
            ->has('filters')
        );
});

it('shows the create speaker form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.speakers.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('admin/speakers/create'));
});

it('creates a speaker with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.speakers.store'), [
            'name' => 'Pastor Mike',
            'title' => 'Senior Pastor',
            'bio' => '<p>A dedicated servant of God.</p>',
        ])
        ->assertRedirect(route('admin.speakers.index'));

    expect(Speaker::where('name', 'Pastor Mike')->exists())->toBeTrue();
});

it('validates name is required when creating a speaker', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.speakers.store'), [
            'name' => '',
        ])
        ->assertSessionHasErrors('name');
});

it('shows the edit speaker form', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.speakers.edit', $speaker))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/speakers/edit')
            ->has('speaker')
        );
});

it('updates a speaker', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create(['name' => 'Old Name']);

    $this->actingAs($staff)
        ->put(route('admin.speakers.update', $speaker), [
            'name' => 'New Name',
            'title' => 'Elder',
        ])
        ->assertRedirect(route('admin.speakers.index'));

    expect($speaker->fresh()->name)->toBe('New Name');
});

it('deletes a speaker', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.speakers.destroy', $speaker))
        ->assertRedirect(route('admin.speakers.index'));

    expect(Speaker::find($speaker->id))->toBeNull();
});

it('filters speakers by search', function () {
    $staff = User::factory()->staff()->create();
    Speaker::factory()->create(['name' => 'John Smith']);
    Speaker::factory()->create(['name' => 'Jane Doe']);

    $this->actingAs($staff)
        ->get(route('admin.speakers.index', ['search' => 'John']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('speakers.data', fn ($speakers) => collect($speakers)->every(fn ($s) => str_contains($s['name'], 'John')))
        );
});

describe('data table', function () {
    it('sorts by a whitelisted column, ignores unknown sorts, and paginates', function () {
        $staff = User::factory()->staff()->create();
        Speaker::factory()->create(['name' => 'Aaron']);
        Speaker::factory()->create(['name' => 'Zoe']);

        $this->actingAs($staff)->get(route('admin.speakers.index', ['sort' => 'name', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->where('speakers.data.0.name', 'Zoe')
                ->where('filters.direction', 'desc')
                ->has('speakers.meta.links'));

        $this->actingAs($staff)->get(route('admin.speakers.index', ['sort' => 'bio', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->where('speakers.data.0.name', 'Aaron')
                ->where('filters.sort', null)
                ->where('speakers.meta.total', 2));
    });
});
