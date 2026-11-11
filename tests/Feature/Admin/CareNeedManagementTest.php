<?php

use App\Enums\CareNeedStatus;
use App\Enums\CareNeedType;
use App\Models\BenevolentRequest;
use App\Models\CareNeed;
use App\Models\CareNeedTask;
use App\Models\CareNeedUpdate;
use App\Models\CounselingCase;
use App\Models\Member;
use App\Models\Ministry;
use App\Models\MinistryMember;
use App\Models\User;
use App\Notifications\CareNeedAssigned;
use App\Notifications\CareTaskAssigned;
use Illuminate\Support\Facades\Notification;

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function careNeedPayload(array $overrides = []): array
{
    return array_merge([
        'member_id' => Member::factory()->create()->id,
        'title' => 'Recovering from surgery',
        'description' => 'Home from hospital on Monday.',
        'type' => 'hospital_visit',
        'priority' => 'high',
        'is_confidential' => false,
        'share_on_prayer_wall' => false,
    ], $overrides);
}

/**
 * A leader with one member in a ministry they lead.
 *
 * @return array{0: User, 1: Member}
 */
function leaderWithMember(): array
{
    $leader = User::factory()->leader()->create();
    $ministry = Ministry::factory()->create(['leader_id' => $leader->id]);
    $member = Member::factory()->withUser()->create();
    MinistryMember::factory()->create(['ministry_id' => $ministry->id, 'user_id' => $member->user_id]);

    return [$leader, $member];
}

beforeEach(fn () => Notification::fake());

describe('listing and visibility', function () {
    it('denies plain members', function () {
        $this->actingAs(User::factory()->create())->get(route('admin.care-needs.index'))->assertForbidden();
    });

    it('shows active needs by default', function () {
        CareNeed::factory()->count(2)->create();
        CareNeed::factory()->withStatus(CareNeedStatus::Resolved)->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.care-needs.index'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('admin/care-needs/index')
                ->has('careNeeds.data', 2)
                ->where('counts.active', 2)
            );
    });

    it('filters by assignee, overdue, type, and status', function () {
        $staff = User::factory()->staff()->create();
        CareNeed::factory()->assignedTo($staff)->create();
        CareNeed::factory()->overdue()->create();
        CareNeed::factory()->ofType(CareNeedType::Meals)->create();
        CareNeed::factory()->withStatus(CareNeedStatus::Closed)->create();

        $this->actingAs($staff)->get(route('admin.care-needs.index', ['assigned' => 'me']))
            ->assertInertia(fn ($page) => $page->has('careNeeds.data', 1));
        $this->actingAs($staff)->get(route('admin.care-needs.index', ['overdue' => 1]))
            ->assertInertia(fn ($page) => $page->has('careNeeds.data', 1)->where('careNeeds.data.0.is_overdue', true));
        $this->actingAs($staff)->get(route('admin.care-needs.index', ['type' => 'meals']))
            ->assertInertia(fn ($page) => $page->has('careNeeds.data', 1));
        $this->actingAs($staff)->get(route('admin.care-needs.index', ['status' => 'all']))
            ->assertInertia(fn ($page) => $page->has('careNeeds.data', 4));
    });

    it('hides confidential needs from staff who are not involved, but not from admins', function () {
        $staff = User::factory()->staff()->create();
        $need = CareNeed::factory()->confidential()->create();

        $this->actingAs($staff)->get(route('admin.care-needs.show', $need))->assertForbidden();
        $this->actingAs(User::factory()->admin()->create())->get(route('admin.care-needs.show', $need))->assertSuccessful();

        $need->update(['assigned_to' => $staff->id]);
        $this->actingAs($staff)->get(route('admin.care-needs.show', $need))->assertSuccessful();
    });

    it('shows leaders needs for their people and needs assigned to them', function () {
        [$leader, $member] = leaderWithMember();
        CareNeed::factory()->create(['member_id' => $member->id]);
        CareNeed::factory()->confidential()->create(['member_id' => $member->id]);
        CareNeed::factory()->assignedTo($leader)->create();
        $outsider = CareNeed::factory()->create();

        $this->actingAs($leader)->get(route('admin.care-needs.index'))
            ->assertInertia(fn ($page) => $page->has('careNeeds.data', 2));
        $this->actingAs($leader)->get(route('admin.care-needs.show', $outsider))->assertForbidden();
    });
});

describe('create and edit', function () {
    it('creates a care need and notifies the assignee', function () {
        $staff = User::factory()->staff()->create();
        $assignee = User::factory()->leader()->create();

        $this->actingAs($staff)
            ->post(route('admin.care-needs.store'), careNeedPayload(['assigned_to' => $assignee->id, 'due_on' => now()->addDay()->toDateString()]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $need = CareNeed::sole();
        expect($need->created_by)->toBe($staff->id)
            ->and($need->updates()->count())->toBe(1);
        Notification::assertSentTo($assignee, CareNeedAssigned::class);
    });

    it('accepts a typed name when the person is not in the directory', function () {
        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.store'), careNeedPayload(['member_id' => null, 'requester_name' => 'Martha Guest']))
            ->assertSessionHasNoErrors();

        expect(CareNeed::sole()->person_name)->toBe('Martha Guest');
    });

    it('validates care need input', function (array $payload, string $field) {
        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.store'), careNeedPayload($payload))
            ->assertSessionHasErrors($field);
    })->with([
        'no person' => [['member_id' => null, 'requester_name' => ''], 'member_id'],
        'missing title' => [['title' => ''], 'title'],
        'unknown type' => [['type' => 'pizza'], 'type'],
        'unknown priority' => [['priority' => 'meh'], 'priority'],
        'bad date' => [['due_on' => 'not-a-date'], 'due_on'],
    ]);

    it('refuses to assign a need to a plain member', function () {
        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.store'), careNeedPayload(['assigned_to' => User::factory()->create()->id]))
            ->assertSessionHasErrors(['assigned_to' => 'Care needs can only be assigned to leaders or staff.']);
    });

    it('stops leaders adding needs for people outside their ministries', function () {
        [$leader, $member] = leaderWithMember();

        $this->actingAs($leader)
            ->post(route('admin.care-needs.store'), careNeedPayload(['member_id' => $member->id]))
            ->assertSessionHasNoErrors();

        $this->actingAs($leader)
            ->post(route('admin.care-needs.store'), careNeedPayload())
            ->assertSessionHasErrors('member_id');
    });

    it('updates a need, recording status and assignment on the timeline', function () {
        $staff = User::factory()->staff()->create();
        $leader = User::factory()->leader()->create();
        $need = CareNeed::factory()->create();

        $this->actingAs($staff)
            ->put(route('admin.care-needs.update', $need), careNeedPayload([
                'member_id' => $need->member_id,
                'status' => 'resolved',
                'assigned_to' => $leader->id,
            ]))
            ->assertRedirect(route('admin.care-needs.show', $need));

        $need->refresh();
        expect($need->status)->toBe(CareNeedStatus::Resolved)
            ->and($need->resolved_at)->not->toBeNull()
            ->and($need->assigned_to)->toBe($leader->id)
            ->and($need->updates()->count())->toBe(2);
    });

    it('only lets staff delete a need', function () {
        [$leader, $member] = leaderWithMember();
        $need = CareNeed::factory()->create(['member_id' => $member->id]);

        $this->actingAs($leader)->delete(route('admin.care-needs.destroy', $need))->assertForbidden();
        $this->actingAs(User::factory()->staff()->create())->delete(route('admin.care-needs.destroy', $need))->assertRedirect();

        expect(CareNeed::count())->toBe(0);
    });
});

describe('timeline', function () {
    it('logs a contact and moves an open need to in progress', function () {
        $staff = User::factory()->staff()->create();
        $need = CareNeed::factory()->create();

        $this->actingAs($staff)
            ->post(route('admin.care-needs.updates.store', $need), ['body' => 'Called, all is well.', 'contact_method' => 'call'])
            ->assertSessionHasNoErrors();

        expect($need->fresh()->status)->toBe(CareNeedStatus::InProgress)
            ->and($need->updates()->where('body', 'Called, all is well.')->exists())->toBeTrue();
    });

    it('keeps an open need open when only a note is added', function () {
        $need = CareNeed::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.updates.store', $need), ['body' => 'Waiting to hear back.', 'contact_method' => 'note']);

        expect($need->fresh()->status)->toBe(CareNeedStatus::Open);
    });

    it('can resolve a need while logging an update', function () {
        $need = CareNeed::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.updates.store', $need), ['body' => 'All sorted.', 'contact_method' => 'visit', 'status' => 'resolved']);

        $update = $need->updates()->first();
        expect($need->fresh()->status)->toBe(CareNeedStatus::Resolved)
            ->and($update->to_status)->toBe(CareNeedStatus::Resolved)
            ->and($need->updates()->count())->toBe(1);
    });

    it('validates timeline updates', function () {
        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.updates.store', CareNeed::factory()->create()), ['body' => '', 'contact_method' => 'pigeon'])
            ->assertSessionHasErrors(['body', 'contact_method']);
    });
});

describe('escalation', function () {
    it('escalates to benevolence', function () {
        $staff = User::factory()->staff()->create();
        $need = CareNeed::factory()->ofType(CareNeedType::Meals)->create(['priority' => 'urgent']);

        $response = $this->actingAs($staff)
            ->post(route('admin.care-needs.escalate', $need), ['target' => 'benevolence', 'amount_requested' => 150]);

        $request = BenevolentRequest::sole();
        $response->assertRedirect(route('admin.benevolent-requests.show', $request));
        expect($request->category->value)->toBe('food')
            ->and($request->urgency->value)->toBe('critical')
            ->and((float) $request->amount_requested)->toBe(150.0)
            ->and($need->fresh()->status)->toBe(CareNeedStatus::Escalated)
            ->and($need->fresh()->benevolent_request_id)->toBe($request->id);
    });

    it('escalates to counseling and makes the need confidential', function () {
        $need = CareNeed::factory()->ofType(CareNeedType::Bereavement)->create(['share_on_prayer_wall' => true]);

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.escalate', $need), ['target' => 'counseling'])
            ->assertRedirect();

        $case = CounselingCase::sole();
        expect($case->case_type->value)->toBe('grief')
            ->and($need->fresh())
            ->is_confidential->toBeTrue()
            ->share_on_prayer_wall->toBeFalse()
            ->counseling_case_id->toBe($case->id);
    });

    it('will not escalate twice', function () {
        $staff = User::factory()->staff()->create();
        $need = CareNeed::factory()->create();

        $this->actingAs($staff)->post(route('admin.care-needs.escalate', $need), ['target' => 'counseling']);
        $this->actingAs($staff)->post(route('admin.care-needs.escalate', $need), ['target' => 'benevolence'])->assertSessionHas('info');

        expect(BenevolentRequest::count())->toBe(0);
    });

    it('validates escalation and blocks leaders', function () {
        [$leader, $member] = leaderWithMember();
        $need = CareNeed::factory()->create(['member_id' => $member->id]);

        $this->actingAs(User::factory()->staff()->create())
            ->post(route('admin.care-needs.escalate', $need), ['target' => 'police', 'amount_requested' => -5])
            ->assertSessionHasErrors(['target', 'amount_requested']);

        $this->actingAs($leader)
            ->post(route('admin.care-needs.escalate', $need), ['target' => 'counseling'])
            ->assertForbidden();
    });
});

describe('practical help tasks', function () {
    it('adds a task and validates it', function () {
        $staff = User::factory()->staff()->create();
        $need = CareNeed::factory()->create();

        $this->actingAs($staff)
            ->post(route('admin.care-needs.tasks.store', $need), ['description' => 'Dinner on Tuesday', 'due_on' => now()->addDay()->toDateString()])
            ->assertSessionHasNoErrors();
        $this->actingAs($staff)
            ->post(route('admin.care-needs.tasks.store', $need), ['description' => ''])
            ->assertSessionHasErrors('description');

        expect($need->tasks()->count())->toBe(1);
    });

    it('notifies a volunteer when someone else assigns them, but not when they sign up themselves', function () {
        $staff = User::factory()->staff()->create();
        $volunteer = User::factory()->leader()->create();
        $task = CareNeedTask::factory()->create();

        $this->actingAs($staff)
            ->patch(route('admin.care-needs.tasks.assign', [$task->care_need_id, $task]), ['volunteer_id' => $volunteer->id]);
        Notification::assertSentTo($volunteer, CareTaskAssigned::class);

        $this->actingAs($staff)
            ->patch(route('admin.care-needs.tasks.assign', [$task->care_need_id, $task]), ['volunteer_id' => $staff->id]);
        Notification::assertNotSentTo($staff, CareTaskAssigned::class);

        expect($task->fresh()->volunteer_id)->toBe($staff->id);
    });

    it('toggles completion and deletes a task', function () {
        $staff = User::factory()->staff()->create();
        $task = CareNeedTask::factory()->create();

        $this->actingAs($staff)->patch(route('admin.care-needs.tasks.complete', [$task->care_need_id, $task]));
        expect($task->fresh()->isComplete())->toBeTrue();

        $this->actingAs($staff)->patch(route('admin.care-needs.tasks.complete', [$task->care_need_id, $task]));
        expect($task->fresh()->isComplete())->toBeFalse();

        $this->actingAs($staff)->delete(route('admin.care-needs.tasks.destroy', [$task->care_need_id, $task]));
        expect(CareNeedTask::count())->toBe(0);
    });

    it('rejects a task that belongs to a different need', function () {
        $task = CareNeedTask::factory()->create();
        $otherNeed = CareNeed::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->patch(route('admin.care-needs.tasks.complete', [$otherNeed, $task]))
            ->assertNotFound();
    });
});

it('shows care need counts on the admin dashboard', function () {
    $staff = User::factory()->staff()->create();
    CareNeed::factory()->assignedTo($staff)->create();
    CareNeed::factory()->overdue()->create();

    $this->actingAs($staff)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.myCareNeeds', 1)
            ->where('stats.overdueCareNeeds', 1)
        );
});

it('keeps a need visible to the staff member who escalated it to counseling', function () {
    $staff = User::factory()->staff()->create();
    $need = CareNeed::factory()->create();

    $this->actingAs($staff)->post(route('admin.care-needs.escalate', $need), ['target' => 'counseling']);

    expect($need->fresh()->assigned_to)->toBe($staff->id);
    $this->actingAs($staff)->get(route('admin.care-needs.show', $need))->assertSuccessful();
});

describe('split view', function () {
    it('has no selected need unless one is asked for', function () {
        CareNeed::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.care-needs.index'))
            ->assertInertia(fn ($page) => $page->where('selected', null));
    });

    it('loads the selected need for the detail panel', function () {
        $need = CareNeed::factory()->create();
        CareNeedTask::factory()->create(['care_need_id' => $need->id]);
        CareNeedUpdate::factory()->create(['care_need_id' => $need->id]);

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.care-needs.index', ['selected' => $need->id]))
            ->assertInertia(fn ($page) => $page
                ->where('selected.careNeed.data.id', $need->id)
                ->has('selected.updates', 1)
                ->has('selected.tasks', 1)
                ->where('selected.canEscalate', true)
                ->where('filters.selected', (string) $need->id)
            );
    });

    it('never shows a need the user is not allowed to see', function () {
        [$leader] = leaderWithMember();
        $hidden = CareNeed::factory()->create();

        $this->actingAs($leader)
            ->get(route('admin.care-needs.index', ['selected' => $hidden->id]))
            ->assertInertia(fn ($page) => $page->where('selected', null));
    });

    it('returns only the panel on a partial reload', function () {
        $need = CareNeed::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.care-needs.index', ['selected' => $need->id]))
            ->assertInertia(fn ($page) => $page
                ->reloadOnly('selected', fn ($reload) => $reload
                    ->where('selected.careNeed.data.id', $need->id)
                    ->missing('careNeeds')
                )
            );
    });

    it('still serves the full detail page', function () {
        $need = CareNeed::factory()->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.care-needs.show', $need))
            ->assertInertia(fn ($page) => $page
                ->component('admin/care-needs/show')
                ->where('careNeed.data.id', $need->id)
                ->has('updates')
                ->has('careTeam')
            );
    });
});
