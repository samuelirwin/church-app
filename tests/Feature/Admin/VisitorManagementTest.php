<?php

use App\Models\User;
use App\Models\Visitor;
use App\Models\VisitorFollowUp;

it('denies member access to visitor listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.visitors.index'))
        ->assertForbidden();
});

it('allows staff to view visitor listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.visitors.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/visitors/index')
            ->has('visitors')
            ->has('filters')
            ->has('statuses')
        );
});

it('searches visitors by name', function () {
    $staff = User::factory()->staff()->create();
    Visitor::factory()->create(['name' => 'John Smith']);
    Visitor::factory()->create(['name' => 'Jane Doe']);

    $this->actingAs($staff)
        ->get(route('admin.visitors.index', ['search' => 'John']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('visitors.data', 1)
        );
});

it('filters visitors by status', function () {
    $staff = User::factory()->staff()->create();
    Visitor::factory()->create(['follow_up_status' => 'new']);
    Visitor::factory()->contacted()->create();
    Visitor::factory()->contacted()->create();

    $this->actingAs($staff)
        ->get(route('admin.visitors.index', ['status' => 'contacted']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('visitors.data', 2)
        );
});

it('shows visitor detail page', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->create();
    VisitorFollowUp::factory()->count(2)->create(['visitor_id' => $visitor->id]);

    $this->actingAs($staff)
        ->get(route('admin.visitors.show', $visitor))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/visitors/show')
            ->has('visitor')
            ->has('users')
            ->has('statuses')
            ->has('followUpTypes')
        );
});

it('updates visitor status and assignment', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->create();
    $assignee = User::factory()->create();

    $this->actingAs($staff)
        ->patch(route('admin.visitors.update', $visitor), [
            'follow_up_status' => 'contacted',
            'assigned_to' => $assignee->id,
            'notes' => 'Called and left a message.',
        ])
        ->assertRedirect();

    $visitor->refresh();
    expect($visitor->follow_up_status->value)->toBe('contacted');
    expect($visitor->assigned_to)->toBe($assignee->id);
    expect($visitor->notes)->toBe('Called and left a message.');
});

it('deletes a visitor', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.visitors.destroy', $visitor))
        ->assertRedirect(route('admin.visitors.index'));

    expect(Visitor::find($visitor->id))->toBeNull();
});

it('adds a follow-up to a visitor', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.visitors.follow-up', $visitor), [
            'type' => 'call',
            'notes' => 'Spoke with visitor.',
            'followed_up_at' => now()->format('Y-m-d H:i:s'),
        ])
        ->assertRedirect();

    expect(VisitorFollowUp::where('visitor_id', $visitor->id)->count())->toBe(1);
});

it('validates follow-up required fields', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->create();

    $this->actingAs($staff)
        ->post(route('admin.visitors.follow-up', $visitor), [])
        ->assertSessionHasErrors(['type', 'followed_up_at']);
});

it('converts a visitor to a user', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->create(['email' => 'visitor@example.com']);

    $this->actingAs($staff)
        ->post(route('admin.visitors.convert', $visitor))
        ->assertRedirect();

    $visitor->refresh();
    expect($visitor->converted_to_user_id)->not->toBeNull();
    expect($visitor->follow_up_status->value)->toBe('connected');
    expect(User::where('email', 'visitor@example.com')->exists())->toBeTrue();
});

it('prevents converting a visitor without email', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->create(['email' => null]);

    $this->actingAs($staff)
        ->post(route('admin.visitors.convert', $visitor))
        ->assertRedirect();

    $visitor->refresh();
    expect($visitor->converted_to_user_id)->toBeNull();
});

it('prevents converting an already converted visitor', function () {
    $staff = User::factory()->staff()->create();
    $existingUser = User::factory()->create();
    $visitor = Visitor::factory()->converted($existingUser)->create();

    $userCountBefore = User::count();

    $this->actingAs($staff)
        ->post(route('admin.visitors.convert', $visitor))
        ->assertRedirect();

    expect(User::count())->toBe($userCountBefore);
});

it('denies member access to visitor detail', function () {
    $member = User::factory()->create();
    $visitor = Visitor::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.visitors.show', $visitor))
        ->assertForbidden();
});

it('sends the follow-up status and labels the visitor pages display', function () {
    $staff = User::factory()->staff()->create();
    $visitor = Visitor::factory()->contacted()->create();
    VisitorFollowUp::factory()->create(['visitor_id' => $visitor->id, 'type' => 'call']);

    $this->actingAs($staff)
        ->get(route('admin.visitors.index'))
        ->assertInertia(fn ($page) => $page
            ->where('visitors.data.0.status', 'contacted')
            ->where('visitors.data.0.status_label', 'Contacted')
            ->where('visitors.data.0.follow_ups_count', 1)
        );

    $this->actingAs($staff)
        ->get(route('admin.visitors.show', $visitor))
        ->assertInertia(fn ($page) => $page
            ->where('visitor.data.status', 'contacted')
            ->where('visitor.data.follow_ups.0.type_label', 'Call')
        );
});

it('saves a status change sent the way the visitor form sends it', function () {
    $visitor = Visitor::factory()->create();

    $this->actingAs(User::factory()->staff()->create())
        ->patch(route('admin.visitors.update', $visitor), ['follow_up_status' => 'connected', 'notes' => 'Joined a group', 'assigned_to' => ''])
        ->assertSessionHasNoErrors();

    expect($visitor->fresh()->follow_up_status->value)->toBe('connected');
});

it('loads the selected visitor into the split-view panel', function () {
    $visitor = Visitor::factory()->create();

    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.visitors.index', ['selected' => $visitor->id]))
        ->assertInertia(fn ($page) => $page
            ->where('selected.visitor.data.id', $visitor->id)
            ->has('selected.followUpTypes')
            ->reloadOnly('selected', fn ($reload) => $reload
                ->where('selected.visitor.data.id', $visitor->id)
                ->missing('visitors')
            )
        );
});

it('has no panel when nothing or an unknown visitor is selected', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)->get(route('admin.visitors.index'))
        ->assertInertia(fn ($page) => $page->where('selected', null));
    $this->actingAs($staff)->get(route('admin.visitors.index', ['selected' => 9999]))
        ->assertInertia(fn ($page) => $page->where('selected', null));
});
