<?php

use App\Models\SermonSeries;
use App\Models\User;

it('denies member access to series listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.series.index'))
        ->assertForbidden();
});

it('allows staff to view series listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.series.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/series/index')
            ->has('series')
            ->has('filters')
        );
});

it('shows the create series form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.series.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('admin/series/create'));
});

it('creates a series with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.series.store'), [
            'title' => 'Through the Bible',
            'description' => '<p>A journey through Scripture.</p>',
            'start_date' => '2026-01-01',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.series.index'));

    expect(SermonSeries::where('title', 'Through the Bible')->exists())->toBeTrue();
});

it('validates title is required when creating a series', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.series.store'), [
            'title' => '',
        ])
        ->assertSessionHasErrors('title');
});

it('validates end_date must be after start_date', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.series.store'), [
            'title' => 'Test Series',
            'start_date' => '2026-06-01',
            'end_date' => '2026-01-01',
        ])
        ->assertSessionHasErrors('end_date');
});

it('shows the edit series form', function () {
    $staff = User::factory()->staff()->create();
    $series = SermonSeries::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.series.edit', $series))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/series/edit')
            ->has('series')
        );
});

it('updates a series', function () {
    $staff = User::factory()->staff()->create();
    $series = SermonSeries::factory()->create(['title' => 'Old Title']);

    $this->actingAs($staff)
        ->put(route('admin.series.update', $series), [
            'title' => 'New Title',
            'start_date' => '2026-01-01',
        ])
        ->assertRedirect(route('admin.series.index'));

    expect($series->fresh()->title)->toBe('New Title');
});

it('deletes a series', function () {
    $staff = User::factory()->staff()->create();
    $series = SermonSeries::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.series.destroy', $series))
        ->assertRedirect(route('admin.series.index'));

    expect(SermonSeries::find($series->id))->toBeNull();
});
