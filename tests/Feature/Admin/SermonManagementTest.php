<?php

use App\Models\Sermon;
use App\Models\Speaker;
use App\Models\User;

it('denies member access to sermon listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.sermons.index'))
        ->assertForbidden();
});

it('allows staff to view sermon listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.sermons.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/sermons/index')
            ->has('sermons')
            ->has('filters')
            ->has('speakers')
            ->has('seriesList')
        );
});

it('shows the create sermon form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.sermons.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/sermons/create')
            ->has('speakers')
            ->has('seriesList')
        );
});

it('creates a sermon with valid data', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.sermons.store'), [
            'title' => 'The Power of Prayer',
            'description' => '<p>A message about prayer.</p>',
            'sermon_date' => '2026-02-22',
            'speaker_id' => $speaker->id,
            'published_at' => '2026-02-22 10:00',
        ])
        ->assertRedirect(route('admin.sermons.index'));

    expect(Sermon::where('title', 'The Power of Prayer')->exists())->toBeTrue();
});

it('creates a sermon with tags', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.sermons.store'), [
            'title' => 'Tagged Sermon',
            'sermon_date' => '2026-02-22',
            'speaker_id' => $speaker->id,
            'tags' => ['prayer', 'faith'],
        ])
        ->assertRedirect(route('admin.sermons.index'));

    $sermon = Sermon::where('title', 'Tagged Sermon')->first();
    expect($sermon->tags)->toHaveCount(2);
});

it('validates required fields when creating a sermon', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.sermons.store'), [])
        ->assertSessionHasErrors(['title', 'sermon_date', 'speaker_id']);
});

it('shows the edit sermon form', function () {
    $staff = User::factory()->staff()->create();
    $sermon = Sermon::factory()->published()->create();

    $this->actingAs($staff)
        ->get(route('admin.sermons.edit', $sermon))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/sermons/edit')
            ->has('sermon')
            ->has('speakers')
            ->has('seriesList')
        );
});

it('updates a sermon', function () {
    $staff = User::factory()->staff()->create();
    $sermon = Sermon::factory()->published()->create();
    $speaker = Speaker::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.sermons.update', $sermon), [
            'title' => 'Updated Title',
            'sermon_date' => '2026-02-22',
            'speaker_id' => $speaker->id,
        ])
        ->assertRedirect(route('admin.sermons.index'));

    expect($sermon->fresh()->title)->toBe('Updated Title');
});

it('deletes a sermon', function () {
    $staff = User::factory()->staff()->create();
    $sermon = Sermon::factory()->published()->create();

    $this->actingAs($staff)
        ->delete(route('admin.sermons.destroy', $sermon))
        ->assertRedirect(route('admin.sermons.index'));

    expect(Sermon::find($sermon->id))->toBeNull();
});

it('validates video_url must be a valid url', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.sermons.store'), [
            'title' => 'Test',
            'sermon_date' => '2026-02-22',
            'speaker_id' => $speaker->id,
            'video_url' => 'not-a-url',
        ])
        ->assertSessionHasErrors('video_url');
});

describe('data table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Sermon::factory()->create(['title' => 'Alpha', 'sermon_date' => now()->subDays(10)]);
        Sermon::factory()->create(['title' => 'Omega', 'sermon_date' => now()->subDays(20)]);

        $this->actingAs($staff)->get(route('admin.sermons.index', ['sort' => 'title', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->where('sermons.data.0.title', 'Omega')
                ->where('filters.sort', 'title')
                ->where('filters.direction', 'desc'));

        $this->actingAs($staff)->get(route('admin.sermons.index', ['sort' => 'created_by; drop', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('sermons.data.0.title', 'Alpha')
                ->where('filters.sort', null));
    });

    it('filters by several speakers and paginates', function () {
        $staff = User::factory()->staff()->create();
        $first = Speaker::factory()->create();
        $second = Speaker::factory()->create();
        Sermon::factory()->count(2)->create(['speaker_id' => $first->id]);
        Sermon::factory()->create(['speaker_id' => $second->id]);
        Sermon::factory()->create();

        $this->actingAs($staff)
            ->get(route('admin.sermons.index', ['speaker_id' => [$first->id, $second->id]]))
            ->assertInertia(fn ($page) => $page
                ->has('sermons.data', 3)
                ->where('filters.speaker_id', [(string) $first->id, (string) $second->id])
                ->where('sermons.meta.total', 3)
                ->has('sermons.meta.links'));
    });

    it('keeps the speaker filter when searching', function () {
        $staff = User::factory()->staff()->create();
        $speaker = Speaker::factory()->create(['name' => 'Grace Hopper']);
        $other = Speaker::factory()->create(['name' => 'Someone Else']);
        Sermon::factory()->create(['title' => 'Grace and truth', 'speaker_id' => $other->id]);
        Sermon::factory()->create(['title' => 'Faith', 'speaker_id' => $speaker->id]);

        // Before grouping the search, the "OR speaker name" let other speakers' sermons slip through.
        $this->actingAs($staff)
            ->get(route('admin.sermons.index', ['search' => 'Grace', 'speaker_id' => [$speaker->id]]))
            ->assertInertia(fn ($page) => $page
                ->has('sermons.data', 1)
                ->where('sermons.data.0.title', 'Faith'));
    });
});
