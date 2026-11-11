<?php

use App\Enums\CategoryType;
use App\Models\Category;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Tag;
use App\Models\User;

it('denies member access to event listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.events.index'))
        ->assertForbidden();
});

it('allows staff to view event listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.events.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/events/index')
            ->has('events')
            ->has('filters')
            ->has('categories')
        );
});

it('shows the create event page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.events.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/events/create')
            ->has('categories')
            ->has('forms')
        );
});

it('creates an event with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.events.store'), [
            'title' => 'Sunday Service',
            'description' => '<p>Weekly Sunday worship service.</p>',
            'location' => 'Main Sanctuary',
            'starts_at' => now()->addDays(7)->format('Y-m-d H:i:s'),
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.events.index'));

    expect(Event::where('title', 'Sunday Service')->exists())->toBeTrue();
});

it('validates required fields when creating an event', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.events.store'), [])
        ->assertSessionHasErrors(['title', 'starts_at']);
});

it('updates an event', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.events.update', $event), [
            'title' => 'Updated Event',
            'starts_at' => now()->addDays(14)->format('Y-m-d H:i:s'),
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.events.index'));

    expect($event->fresh()->title)->toBe('Updated Event');
});

it('deletes an event', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.events.destroy', $event))
        ->assertRedirect(route('admin.events.index'));

    expect(Event::find($event->id))->toBeNull();
});

it('searches events by title', function () {
    $staff = User::factory()->staff()->create();
    Event::factory()->create(['title' => 'Youth Night']);
    Event::factory()->create(['title' => 'Bible Study']);

    $this->actingAs($staff)
        ->get(route('admin.events.index', ['search' => 'Youth']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
        );
});

it('filters events by category', function () {
    $staff = User::factory()->staff()->create();
    $category = Category::factory()->create(['type' => CategoryType::Event]);
    Event::factory()->create(['category_id' => $category->id]);
    Event::factory()->create(['category_id' => null]);

    $this->actingAs($staff)
        ->get(route('admin.events.index', ['category_id' => $category->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('events.data', 1)
        );
});

it('displays event registrations page', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();
    EventRegistration::factory()->count(3)->create(['event_id' => $event->id]);

    $this->actingAs($staff)
        ->get(route('admin.events.registrations', $event))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/events/registrations')
            ->has('registrations.data', 3)
        );
});

it('creates an event with tags', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.events.store'), [
            'title' => 'Tagged Event',
            'starts_at' => now()->addDays(7)->format('Y-m-d H:i:s'),
            'is_published' => true,
            'tags' => ['youth', 'worship'],
        ])
        ->assertRedirect(route('admin.events.index'));

    $event = Event::where('title', 'Tagged Event')->first();
    expect($event->tags)->toHaveCount(2)
        ->and(Tag::count())->toBe(2);
});

it('updates event tags', function () {
    $staff = User::factory()->staff()->create();
    $event = Event::factory()->create();
    $event->syncTags(['old-tag']);

    $this->actingAs($staff)
        ->put(route('admin.events.update', $event), [
            'title' => $event->title,
            'starts_at' => $event->starts_at->format('Y-m-d H:i:s'),
            'is_published' => true,
            'tags' => ['new-tag', 'another'],
        ])
        ->assertRedirect(route('admin.events.index'));

    expect($event->fresh()->tags)->toHaveCount(2)
        ->and($event->fresh()->tags->pluck('name')->toArray())->toEqualCanonicalizing(['new-tag', 'another']);
});

describe('events table', function () {
    it('sorts by title and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Event::factory()->create(['title' => 'Alpha Retreat', 'starts_at' => now()->addDays(1)]);
        Event::factory()->create(['title' => 'Zion Picnic', 'starts_at' => now()->addDays(2)]);

        $this->actingAs($staff)->get(route('admin.events.index', ['sort' => 'title', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('events.data.0.title', 'Alpha Retreat')
                ->where('filters.sort', 'title')
                ->has('events.meta.total'));

        // Unknown sort falls back to the default: latest start date first.
        $this->actingAs($staff)->get(route('admin.events.index', ['sort' => 'secret_column', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('events.data.0.title', 'Zion Picnic')
                ->where('filters.sort', null));
    });

    it('filters by several categories at once', function () {
        $staff = User::factory()->staff()->create();
        $worship = Category::factory()->create(['type' => CategoryType::Event]);
        $outreach = Category::factory()->create(['type' => CategoryType::Event]);
        Event::factory()->create(['category_id' => $worship->id]);
        Event::factory()->create(['category_id' => $outreach->id]);
        Event::factory()->create(['category_id' => null]);

        $this->actingAs($staff)
            ->get(route('admin.events.index', ['category_id' => [$worship->id, $outreach->id]]))
            ->assertInertia(fn ($page) => $page
                ->has('events.data', 2)
                ->where('filters.category_id', [(string) $worship->id, (string) $outreach->id]));
    });

    it('keeps leaders scoped to their own events when searching', function () {
        $leader = User::factory()->leader()->create();
        Event::factory()->create(['created_by' => $leader->id, 'title' => 'Youth Night', 'location' => 'Hall']);
        Event::factory()->create(['title' => 'Other Event', 'location' => 'Hall']);

        $this->actingAs($leader)
            ->get(route('admin.events.index', ['search' => 'Hall']))
            ->assertInertia(fn ($page) => $page->has('events.data', 1)->where('events.data.0.title', 'Youth Night'));
    });

    it('sorts and filters an event\'s registrations', function () {
        $staff = User::factory()->staff()->create();
        $event = Event::factory()->create();
        EventRegistration::factory()->create(['event_id' => $event->id, 'name' => 'Zoe']);
        EventRegistration::factory()->create(['event_id' => $event->id, 'name' => 'Adam']);
        EventRegistration::factory()->waitlisted()->create(['event_id' => $event->id, 'name' => 'Beth']);
        EventRegistration::factory()->cancelled()->create(['event_id' => $event->id, 'name' => 'Carl']);

        $this->actingAs($staff)
            ->get(route('admin.events.registrations', [$event, 'sort' => 'name', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('registrations.data.0.name', 'Adam')
                ->has('registrations.meta.total')
                ->has('statuses', 3));

        $this->actingAs($staff)
            ->get(route('admin.events.registrations', [$event, 'status' => ['waitlisted', 'cancelled']]))
            ->assertInertia(fn ($page) => $page->has('registrations.data', 2)->where('filters.status', ['waitlisted', 'cancelled']));
    });
});
