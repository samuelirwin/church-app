<?php

use App\Models\Ministry;
use App\Models\MinistryMember;
use App\Models\User;

it('denies member access to ministry listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.ministries.index'))
        ->assertForbidden();
});

it('allows staff to view ministry listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.ministries.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ministries/index')
            ->has('ministries')
            ->has('filters')
        );
});

it('shows the create ministry page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.ministries.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ministries/create')
            ->has('users')
        );
});

it('creates a ministry with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.ministries.store'), [
            'name' => 'Youth Ministry',
            'description' => '<p>For young people.</p>',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.ministries.index'));

    expect(Ministry::where('name', 'Youth Ministry')->exists())->toBeTrue();
});

it('validates required fields when creating a ministry', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.ministries.store'), [])
        ->assertSessionHasErrors(['name']);
});

it('updates a ministry', function () {
    $staff = User::factory()->staff()->create();
    $ministry = Ministry::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.ministries.update', $ministry), [
            'name' => 'Updated Ministry',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.ministries.index'));

    expect($ministry->fresh()->name)->toBe('Updated Ministry');
});

it('deletes a ministry', function () {
    $staff = User::factory()->staff()->create();
    $ministry = Ministry::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.ministries.destroy', $ministry))
        ->assertRedirect(route('admin.ministries.index'));

    expect(Ministry::find($ministry->id))->toBeNull();
});

it('searches ministries by name', function () {
    $staff = User::factory()->staff()->create();
    Ministry::factory()->create(['name' => 'Youth Ministry']);
    Ministry::factory()->create(['name' => 'Worship Team']);

    $this->actingAs($staff)
        ->get(route('admin.ministries.index', ['search' => 'Youth']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('ministries.data', 1)
        );
});

it('displays ministry members page', function () {
    $staff = User::factory()->staff()->create();
    $ministry = Ministry::factory()->create();
    MinistryMember::factory()->count(3)->create(['ministry_id' => $ministry->id]);

    $this->actingAs($staff)
        ->get(route('admin.ministries.members', $ministry))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ministries/members')
        );
});

describe('ministries table', function () {
    it('sorts by name and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Ministry::factory()->create(['name' => 'Youth', 'sort_order' => 1]);
        Ministry::factory()->create(['name' => 'Choir', 'sort_order' => 2]);

        $this->actingAs($staff)->get(route('admin.ministries.index', ['sort' => 'name', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('ministries.data.0.name', 'Choir')
                ->has('ministries.meta.total'));

        // Unknown sort keeps the default order (sort_order).
        $this->actingAs($staff)->get(route('admin.ministries.index', ['sort' => 'leader_id', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('ministries.data.0.name', 'Youth')
                ->where('filters.sort', null));
    });

    it('sorts members by name, filters by role, and paginates', function () {
        $staff = User::factory()->staff()->create();
        $ministry = Ministry::factory()->create();
        MinistryMember::factory()->create(['ministry_id' => $ministry->id, 'user_id' => User::factory()->create(['name' => 'Zara Lee'])->id, 'role' => 'leader']);
        MinistryMember::factory()->create(['ministry_id' => $ministry->id, 'user_id' => User::factory()->create(['name' => 'Aaron Kim'])->id, 'role' => 'member']);
        MinistryMember::factory()->create(['ministry_id' => $ministry->id, 'user_id' => User::factory()->create(['name' => 'Mia Cole'])->id, 'role' => 'volunteer']);

        $this->actingAs($staff)
            ->get(route('admin.ministries.members', [$ministry, 'sort' => 'name', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('members.data.0.user.name', 'Aaron Kim')
                ->where('members.total', 3)
                ->has('roles', 3));

        $this->actingAs($staff)
            ->get(route('admin.ministries.members', [$ministry, 'role' => ['leader', 'volunteer']]))
            ->assertInertia(fn ($page) => $page->has('members.data', 2));
    });
});
