<?php

use App\Models\GroupMember;
use App\Models\Ministry;
use App\Models\MinistryGroup;
use App\Models\User;

it('denies member access to group listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.ministry-groups.index'))
        ->assertForbidden();
});

it('allows staff to view group listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.ministry-groups.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ministry-groups/index')
            ->has('groups')
            ->has('filters')
            ->has('ministries')
        );
});

it('creates a ministry group', function () {
    $staff = User::factory()->staff()->create();
    $ministry = Ministry::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.ministry-groups.store'), [
            'name' => 'Small Group A',
            'ministry_id' => $ministry->id,
            'meeting_day' => 'Wednesday',
            'meeting_time' => '7:00 PM',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.ministry-groups.index'));

    expect(MinistryGroup::where('name', 'Small Group A')->exists())->toBeTrue();
});

it('validates required fields when creating a group', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.ministry-groups.store'), [])
        ->assertSessionHasErrors(['name', 'ministry_id']);
});

it('updates a ministry group', function () {
    $staff = User::factory()->staff()->create();
    $group = MinistryGroup::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.ministry-groups.update', $group), [
            'name' => 'Updated Group',
            'ministry_id' => $group->ministry_id,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.ministry-groups.index'));

    expect($group->fresh()->name)->toBe('Updated Group');
});

it('deletes a ministry group', function () {
    $staff = User::factory()->staff()->create();
    $group = MinistryGroup::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.ministry-groups.destroy', $group))
        ->assertRedirect(route('admin.ministry-groups.index'));

    expect(MinistryGroup::find($group->id))->toBeNull();
});

it('searches groups by name', function () {
    $staff = User::factory()->staff()->create();
    MinistryGroup::factory()->create(['name' => 'Youth Group']);
    MinistryGroup::factory()->create(['name' => 'Seniors Group']);

    $this->actingAs($staff)
        ->get(route('admin.ministry-groups.index', ['search' => 'Youth']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('groups.data', 1)
        );
});

it('filters groups by ministry', function () {
    $staff = User::factory()->staff()->create();
    $ministry = Ministry::factory()->create();
    MinistryGroup::factory()->create(['ministry_id' => $ministry->id]);
    MinistryGroup::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.ministry-groups.index', ['ministry_id' => $ministry->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('groups.data', 1)
        );
});

it('displays group members page', function () {
    $staff = User::factory()->staff()->create();
    $group = MinistryGroup::factory()->create();
    GroupMember::factory()->count(2)->create(['ministry_group_id' => $group->id]);

    $this->actingAs($staff)
        ->get(route('admin.ministry-groups.members', $group))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ministry-groups/members')
        );
});

describe('groups table', function () {
    it('sorts by member count, filters by several ministries, and paginates', function () {
        $staff = User::factory()->staff()->create();
        $first = Ministry::factory()->create();
        $second = Ministry::factory()->create();
        $busy = MinistryGroup::factory()->create(['ministry_id' => $first->id, 'name' => 'Busy']);
        GroupMember::factory()->count(3)->create(['ministry_group_id' => $busy->id]);
        MinistryGroup::factory()->create(['ministry_id' => $second->id, 'name' => 'Quiet']);
        MinistryGroup::factory()->create(['name' => 'Elsewhere']);

        $this->actingAs($staff)
            ->get(route('admin.ministry-groups.index', ['sort' => 'members', 'direction' => 'desc', 'ministry_id' => [$first->id, $second->id]]))
            ->assertInertia(fn ($page) => $page
                ->has('groups.data', 2)
                ->where('groups.data.0.name', 'Busy')
                ->where('groups.data.0.group_members_count', 3)
                ->has('groups.meta.total'));
    });

    it('ignores unknown sorts', function () {
        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.ministry-groups.index', ['sort' => 'nonsense']))
            ->assertInertia(fn ($page) => $page->where('filters.sort', null));
    });

    it('sorts a group\'s members by name and paginates', function () {
        $staff = User::factory()->staff()->create();
        $group = MinistryGroup::factory()->create();
        GroupMember::factory()->create(['ministry_group_id' => $group->id, 'user_id' => User::factory()->create(['name' => 'Yusuf'])->id]);
        GroupMember::factory()->create(['ministry_group_id' => $group->id, 'user_id' => User::factory()->create(['name' => 'Bella'])->id]);

        $this->actingAs($staff)
            ->get(route('admin.ministry-groups.members', [$group, 'sort' => 'name', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('members.data.0.user.name', 'Bella')
                ->where('members.total', 2));
    });
});
