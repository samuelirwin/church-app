<?php

use App\Models\Highlight;
use App\Models\User;

it('denies member access to highlight listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.highlights.index'))
        ->assertForbidden();
});

it('allows staff to view highlight listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.highlights.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/highlights/index')
            ->has('highlights')
            ->has('filters')
            ->has('types')
        );
});

it('shows the create highlight form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.highlights.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/highlights/create')
            ->has('types')
        );
});

it('creates a highlight with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.highlights.store'), [
            'title' => 'Christmas Service Schedule',
            'body' => '<p>Join us for our Christmas services.</p>',
            'type' => 'announcement',
            'priority' => 8,
            'starts_at' => '2026-12-20 00:00',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.highlights.index'));

    expect(Highlight::where('title', 'Christmas Service Schedule')->exists())->toBeTrue();
});

it('validates required fields when creating a highlight', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.highlights.store'), [])
        ->assertSessionHasErrors(['title', 'body', 'type', 'priority', 'starts_at']);
});

it('validates type must be a valid enum value', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.highlights.store'), [
            'title' => 'Test',
            'body' => '<p>Test body.</p>',
            'type' => 'invalid-type',
            'priority' => 5,
            'starts_at' => '2026-02-22 10:00',
        ])
        ->assertSessionHasErrors('type');
});

it('validates ends_at must be after or equal to starts_at', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.highlights.store'), [
            'title' => 'Test',
            'body' => '<p>Test body.</p>',
            'type' => 'event',
            'priority' => 5,
            'starts_at' => '2026-03-15 10:00',
            'ends_at' => '2026-03-10 10:00',
        ])
        ->assertSessionHasErrors('ends_at');
});

it('validates priority must be between 1 and 10', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.highlights.store'), [
            'title' => 'Test',
            'body' => '<p>Test body.</p>',
            'type' => 'campaign',
            'priority' => 15,
            'starts_at' => '2026-02-22 10:00',
        ])
        ->assertSessionHasErrors('priority');
});

it('shows the edit highlight form', function () {
    $staff = User::factory()->staff()->create();
    $highlight = Highlight::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.highlights.edit', $highlight))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/highlights/edit')
            ->has('highlight')
            ->has('types')
        );
});

it('updates a highlight', function () {
    $staff = User::factory()->staff()->create();
    $highlight = Highlight::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.highlights.update', $highlight), [
            'title' => 'Updated Highlight Title',
            'body' => '<p>Updated body.</p>',
            'type' => 'testimony',
            'priority' => 3,
            'starts_at' => '2026-02-22 10:00',
        ])
        ->assertRedirect(route('admin.highlights.index'));

    expect($highlight->fresh()->title)->toBe('Updated Highlight Title');
});

it('deletes a highlight', function () {
    $staff = User::factory()->staff()->create();
    $highlight = Highlight::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.highlights.destroy', $highlight))
        ->assertRedirect(route('admin.highlights.index'));

    expect(Highlight::find($highlight->id))->toBeNull();
});

it('filters highlights by type', function () {
    $staff = User::factory()->staff()->create();
    Highlight::factory()->create(['type' => 'announcement']);
    Highlight::factory()->create(['type' => 'event']);

    $this->actingAs($staff)
        ->get(route('admin.highlights.index', ['type' => 'announcement']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('highlights.data', 1)
        );
});

describe('data table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Highlight::factory()->create(['title' => 'Low', 'priority' => 1]);
        Highlight::factory()->create(['title' => 'High', 'priority' => 9]);

        $this->actingAs($staff)->get(route('admin.highlights.index', ['sort' => 'priority', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page->where('highlights.data.0.title', 'Low')->where('filters.sort', 'priority'));

        // Unknown sort falls back to the default: highest priority first.
        $this->actingAs($staff)->get(route('admin.highlights.index', ['sort' => 'body', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page->where('highlights.data.0.title', 'High')->where('filters.sort', null));
    });

    it('filters by several types and paginates', function () {
        $staff = User::factory()->staff()->create();
        Highlight::factory()->create(['type' => 'announcement']);
        Highlight::factory()->create(['type' => 'event']);
        Highlight::factory()->create(['type' => 'campaign']);

        $this->actingAs($staff)
            ->get(route('admin.highlights.index', ['type' => ['announcement', 'event']]))
            ->assertInertia(fn ($page) => $page
                ->has('highlights.data', 2)
                ->where('filters.type', ['announcement', 'event'])
                ->where('highlights.meta.total', 2)
                ->has('highlights.meta.links'));
    });
});
