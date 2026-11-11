<?php

use App\Models\ReadingPlan;
use App\Models\ReadingPlanDay;
use App\Models\User;

it('denies member access to reading plan listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.reading-plans.index'))
        ->assertForbidden();
});

it('allows staff to view reading plan listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.reading-plans.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reading-plans/index')
            ->has('plans')
            ->has('filters')
        );
});

it('shows the create reading plan form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.reading-plans.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reading-plans/create')
        );
});

it('creates a reading plan with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.reading-plans.store'), [
            'title' => 'Gospel of John Study',
            'description' => '<p>A deep dive into the Gospel of John.</p>',
            'duration_days' => 21,
            'is_published' => true,
        ])
        ->assertRedirect();

    expect(ReadingPlan::where('title', 'Gospel of John Study')->exists())->toBeTrue();
});

it('validates required fields when creating a reading plan', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.reading-plans.store'), [])
        ->assertSessionHasErrors(['title', 'duration_days']);
});

it('validates duration_days range', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.reading-plans.store'), [
            'title' => 'Invalid Plan',
            'duration_days' => 0,
        ])
        ->assertSessionHasErrors(['duration_days']);

    $this->actingAs($staff)
        ->post(route('admin.reading-plans.store'), [
            'title' => 'Invalid Plan',
            'duration_days' => 400,
        ])
        ->assertSessionHasErrors(['duration_days']);
});

it('shows the edit reading plan form', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.reading-plans.edit', $plan))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reading-plans/edit')
            ->has('plan')
        );
});

it('updates a reading plan', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.reading-plans.update', $plan), [
            'title' => 'Updated Plan Title',
            'duration_days' => 30,
        ])
        ->assertRedirect(route('admin.reading-plans.index'));

    expect($plan->fresh()->title)->toBe('Updated Plan Title');
});

it('deletes a reading plan', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.reading-plans.destroy', $plan))
        ->assertRedirect(route('admin.reading-plans.index'));

    expect(ReadingPlan::find($plan->id))->toBeNull();
});

it('searches reading plans by title', function () {
    $staff = User::factory()->staff()->create();
    ReadingPlan::factory()->create(['title' => 'Psalms Journey']);
    ReadingPlan::factory()->create(['title' => 'New Testament Overview']);

    $this->actingAs($staff)
        ->get(route('admin.reading-plans.index', ['search' => 'Psalms']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('plans.data', 1)
        );
});

it('shows the day management page', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.reading-plans.show', $plan))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reading-plans/days')
            ->has('plan')
        );
});

it('adds a day to a reading plan', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.reading-plans.days.store', $plan), [
            'day_number' => 1,
            'title' => 'In the Beginning',
            'scripture_reference' => 'Genesis 1:1-31',
            'reflection' => 'Consider the power of creation.',
        ])
        ->assertRedirect(route('admin.reading-plans.show', $plan));

    expect($plan->days()->count())->toBe(1);
});

it('validates required fields when adding a day', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.reading-plans.days.store', $plan), [])
        ->assertSessionHasErrors(['day_number', 'title', 'scripture_reference']);
});

it('updates a day in a reading plan', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();
    $day = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
        'day_number' => 1,
    ]);

    $this->actingAs($staff)
        ->put(route('admin.reading-plans.days.update', [$plan, $day]), [
            'day_number' => 1,
            'title' => 'Updated Day Title',
            'scripture_reference' => 'Genesis 2:1-25',
        ])
        ->assertRedirect(route('admin.reading-plans.show', $plan));

    expect($day->fresh()->title)->toBe('Updated Day Title');
});

it('deletes a day from a reading plan', function () {
    $staff = User::factory()->staff()->create();
    $plan = ReadingPlan::factory()->create();
    $day = ReadingPlanDay::factory()->create([
        'reading_plan_id' => $plan->id,
    ]);

    $this->actingAs($staff)
        ->delete(route('admin.reading-plans.days.destroy', [$plan, $day]))
        ->assertRedirect(route('admin.reading-plans.show', $plan));

    expect(ReadingPlanDay::find($day->id))->toBeNull();
});

describe('reading plans table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        ReadingPlan::factory()->create(['title' => 'Acts in a Month', 'created_at' => now()->subDay()]);
        ReadingPlan::factory()->create(['title' => 'Zechariah Study', 'created_at' => now()->subDays(2)]);

        $this->actingAs($staff)->get(route('admin.reading-plans.index', ['sort' => 'title', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->where('plans.data.0.title', 'Zechariah Study')
                ->where('filters.sort', 'title')
                ->where('filters.direction', 'desc'));

        $this->actingAs($staff)->get(route('admin.reading-plans.index', ['sort' => 'slug; drop table', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page
                ->where('plans.data.0.title', 'Acts in a Month')
                ->where('filters.sort', null)
                ->where('filters.direction', null));
    });

    it('includes pagination meta', function () {
        ReadingPlan::factory()->count(16)->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.reading-plans.index'))
            ->assertInertia(fn ($page) => $page
                ->has('plans.data', 15)
                ->where('plans.meta.total', 16)
                ->where('plans.meta.last_page', 2));
    });
});
