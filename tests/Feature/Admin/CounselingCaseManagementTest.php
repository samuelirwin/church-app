<?php

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Enums\GoalStatus;
use App\Enums\ReferralType;
use App\Enums\SessionType;
use App\Models\CounselingCase;
use App\Models\CounselingGoal;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// --- Confidentiality Tests ---

it('denies member access to counseling cases', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.counseling-cases.index'))
        ->assertForbidden();
});

it('allows admin to see all counseling cases', function () {
    $admin = User::factory()->admin()->create();
    $counselor = User::factory()->staff()->create();

    CounselingCase::factory()->assignedTo($counselor)->openedBy($admin)->create();
    CounselingCase::factory()->assignedTo($admin)->openedBy($admin)->create();

    $this->actingAs($admin)
        ->get(route('admin.counseling-cases.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/counseling-cases/index')
            ->has('cases.data', 2)
        );
});

it('counselor only sees assigned cases', function () {
    $admin = User::factory()->admin()->create();
    $counselor = User::factory()->staff()->create();
    $otherCounselor = User::factory()->staff()->create();

    CounselingCase::factory()->assignedTo($counselor)->openedBy($admin)->create();
    CounselingCase::factory()->assignedTo($otherCounselor)->openedBy($admin)->create();

    $this->actingAs($counselor)
        ->get(route('admin.counseling-cases.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('cases.data', 1)
        );
});

it('denies unassigned staff from viewing case detail', function () {
    $admin = User::factory()->admin()->create();
    $counselor = User::factory()->staff()->create();
    $unassigned = User::factory()->staff()->create();

    $case = CounselingCase::factory()->assignedTo($counselor)->openedBy($admin)->create();

    $this->actingAs($unassigned)
        ->get(route('admin.counseling-cases.show', $case))
        ->assertForbidden();
});

it('allows assigned counselor to view case detail', function () {
    $admin = User::factory()->admin()->create();
    $counselor = User::factory()->staff()->create();

    $case = CounselingCase::factory()->assignedTo($counselor)->openedBy($admin)->create();

    $this->actingAs($counselor)
        ->get(route('admin.counseling-cases.show', $case))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/counseling-cases/show')
            ->has('counselingCase')
        );
});

// --- CRUD Tests ---

it('shows the create counseling case page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.counseling-cases.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/counseling-cases/create')
            ->has('caseTypes')
            ->has('counselors')
        );
});

it('creates a counseling case with auto-generated case number', function () {
    $admin = User::factory()->admin()->create();
    $counselor = User::factory()->staff()->create();

    $this->actingAs($admin)
        ->post(route('admin.counseling-cases.store'), [
            'person_name' => 'John Doe',
            'person_contact' => '555-1234',
            'person_email' => 'john@example.com',
            'case_type' => CaseType::Individual->value,
            'presenting_issue' => 'Struggling with anxiety.',
            'assigned_counselor_id' => $counselor->id,
        ])
        ->assertRedirect();

    $case = CounselingCase::first();
    expect($case)->not->toBeNull();
    expect($case->case_number)->toStartWith('CC-'.now()->year.'-');
    expect($case->opened_by)->toBe($admin->id);
    expect($case->opened_at)->not->toBeNull();
});

it('validates required fields when creating a case', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.counseling-cases.store'), [])
        ->assertSessionHasErrors(['person_name', 'case_type', 'presenting_issue']);
});

it('updates a counseling case', function () {
    $admin = User::factory()->admin()->create();
    $case = CounselingCase::factory()->assignedTo($admin)->openedBy($admin)->create();

    $this->actingAs($admin)
        ->put(route('admin.counseling-cases.update', $case), [
            'person_name' => 'Updated Name',
            'case_type' => CaseType::Couples->value,
            'status' => CaseStatus::Active->value,
            'presenting_issue' => 'Updated issue.',
        ])
        ->assertRedirect();

    $case->refresh();
    expect($case->person_name)->toBe('Updated Name');
    expect($case->status)->toBe(CaseStatus::Active);
});

it('auto-sets closed_at when status changes to closed', function () {
    $admin = User::factory()->admin()->create();
    $case = CounselingCase::factory()->active()->assignedTo($admin)->openedBy($admin)->create();

    expect($case->closed_at)->toBeNull();

    $this->actingAs($admin)
        ->put(route('admin.counseling-cases.update', $case), [
            'person_name' => $case->person_name,
            'case_type' => $case->case_type->value,
            'status' => CaseStatus::ClosedResolved->value,
            'presenting_issue' => $case->presenting_issue,
            'closure_reason' => 'Issues resolved.',
        ])
        ->assertRedirect();

    expect($case->fresh()->closed_at)->not->toBeNull();
});

it('only admin can delete a counseling case', function () {
    $admin = User::factory()->admin()->create();
    $staff = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($staff)->openedBy($admin)->create();

    $this->actingAs($staff)
        ->delete(route('admin.counseling-cases.destroy', $case))
        ->assertForbidden();

    $this->actingAs($admin)
        ->delete(route('admin.counseling-cases.destroy', $case))
        ->assertRedirect(route('admin.counseling-cases.index'));

    $this->assertDatabaseMissing('counseling_cases', ['id' => $case->id]);
});

// --- Session Tests ---

it('logs a counseling session', function () {
    $counselor = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($counselor)->create();

    $this->actingAs($counselor)
        ->post(route('admin.counseling-cases.sessions', $case), [
            'session_date' => now()->toDateTimeString(),
            'duration_minutes' => 60,
            'session_type' => SessionType::InPerson->value,
            'notes' => 'Good session.',
            'mood_rating' => 7,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('counseling_sessions', [
        'counseling_case_id' => $case->id,
        'counselor_id' => $counselor->id,
        'duration_minutes' => 60,
    ]);
});

it('validates session duration limits', function () {
    $counselor = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($counselor)->create();

    $this->actingAs($counselor)
        ->post(route('admin.counseling-cases.sessions', $case), [
            'session_date' => now()->toDateTimeString(),
            'duration_minutes' => 3,
            'session_type' => SessionType::InPerson->value,
        ])
        ->assertSessionHasErrors('duration_minutes');
});

it('prevents unassigned staff from adding session', function () {
    $admin = User::factory()->admin()->create();
    $counselor = User::factory()->staff()->create();
    $unassigned = User::factory()->staff()->create();

    $case = CounselingCase::factory()->assignedTo($counselor)->openedBy($admin)->create();

    $this->actingAs($unassigned)
        ->post(route('admin.counseling-cases.sessions', $case), [
            'session_date' => now()->toDateTimeString(),
            'duration_minutes' => 60,
            'session_type' => SessionType::InPerson->value,
        ])
        ->assertForbidden();
});

// --- Goal Tests ---

it('adds a goal to a counseling case', function () {
    $counselor = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($counselor)->create();

    $this->actingAs($counselor)
        ->post(route('admin.counseling-cases.goals.store', $case), [
            'title' => 'Reduce anxiety episodes',
            'description' => 'Target fewer than 2 per week.',
            'target_date' => now()->addMonth()->toDateString(),
        ])
        ->assertRedirect();

    $goal = $case->goals()->first();
    expect($goal->title)->toBe('Reduce anxiety episodes');
    expect($goal->created_by)->toBe($counselor->id);
    expect($goal->priority)->toBe(1);
});

it('updates a goal status', function () {
    $counselor = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($counselor)->create();
    $goal = CounselingGoal::factory()->active()->create([
        'counseling_case_id' => $case->id,
        'created_by' => $counselor->id,
    ]);

    $this->actingAs($counselor)
        ->put(route('admin.counseling-cases.goals.update', [$case, $goal]), [
            'title' => $goal->title,
            'status' => GoalStatus::Achieved->value,
        ])
        ->assertRedirect();

    expect($goal->fresh()->status)->toBe(GoalStatus::Achieved);
});

it('prevents updating a goal from another case', function () {
    $admin = User::factory()->admin()->create();
    $case1 = CounselingCase::factory()->assignedTo($admin)->openedBy($admin)->create();
    $case2 = CounselingCase::factory()->assignedTo($admin)->openedBy($admin)->create();

    $goal = CounselingGoal::factory()->create([
        'counseling_case_id' => $case2->id,
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.counseling-cases.goals.update', [$case1, $goal]), [
            'title' => 'Hacked',
            'status' => GoalStatus::Achieved->value,
        ])
        ->assertNotFound();
});

// --- Referral Tests ---

it('adds a referral', function () {
    $counselor = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($counselor)->create();

    $this->actingAs($counselor)
        ->post(route('admin.counseling-cases.referrals', $case), [
            'referred_to' => 'Local Clinic',
            'referral_type' => ReferralType::Medical->value,
            'referral_date' => now()->toDateString(),
            'reason' => 'Needs professional assessment.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('counseling_referrals', [
        'counseling_case_id' => $case->id,
        'referred_by' => $counselor->id,
        'referral_type' => ReferralType::Medical->value,
    ]);
});

// --- Document Upload Tests ---

it('uploads case documents', function () {
    Storage::fake('media');
    $counselor = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($counselor)->create();

    $this->actingAs($counselor)
        ->post(route('admin.counseling-cases.attachments', $case), [
            'documents' => [
                UploadedFile::fake()->create('notes.pdf', 512, 'application/pdf'),
            ],
        ])
        ->assertRedirect();

    expect($case->getMedia('case_documents'))->toHaveCount(1);
});

// --- Search/Filter Tests ---

it('searches counseling cases by person name', function () {
    $admin = User::factory()->admin()->create();
    CounselingCase::factory()->openedBy($admin)->create(['person_name' => 'Alice Johnson']);
    CounselingCase::factory()->openedBy($admin)->create(['person_name' => 'Bob Williams']);

    $this->actingAs($admin)
        ->get(route('admin.counseling-cases.index', ['search' => 'Alice']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('cases.data', 1)
        );
});

it('filters counseling cases by status', function () {
    $admin = User::factory()->admin()->create();
    CounselingCase::factory()->open()->openedBy($admin)->create();
    CounselingCase::factory()->active()->openedBy($admin)->create();
    CounselingCase::factory()->active()->openedBy($admin)->create();

    $this->actingAs($admin)
        ->get(route('admin.counseling-cases.index', ['status' => 'active']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('cases.data', 2)
        );
});

it('filters counseling cases by case type', function () {
    $admin = User::factory()->admin()->create();
    CounselingCase::factory()->openedBy($admin)->create(['case_type' => CaseType::Crisis]);
    CounselingCase::factory()->openedBy($admin)->create(['case_type' => CaseType::Individual]);

    $this->actingAs($admin)
        ->get(route('admin.counseling-cases.index', ['case_type' => 'crisis']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('cases.data', 1)
        );
});

it('shows the edit page for assigned counselor', function () {
    $counselor = User::factory()->staff()->create();
    $case = CounselingCase::factory()->assignedTo($counselor)->create();

    $this->actingAs($counselor)
        ->get(route('admin.counseling-cases.edit', $case))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/counseling-cases/edit')
        );
});

it('generates unique case numbers sequentially', function () {
    $admin = User::factory()->admin()->create();

    CounselingCase::factory()->openedBy($admin)->create();
    CounselingCase::factory()->openedBy($admin)->create();

    $cases = CounselingCase::orderBy('id')->get();
    $year = now()->year;

    expect($cases[0]->case_number)->toBe("CC-{$year}-0001");
    expect($cases[1]->case_number)->toBe("CC-{$year}-0002");
});

it('denies leader without deacon status from counseling cases', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.counseling-cases.index'))
        ->assertForbidden();
});

it('allows deacon to access counseling cases index', function () {
    $leader = User::factory()->leader()->create();
    $governance = \App\Models\Ministry::factory()->create(['is_governance_body' => true]);
    \App\Models\MinistryMember::factory()->create(['user_id' => $leader->id, 'ministry_id' => $governance->id]);

    $this->actingAs($leader)
        ->get(route('admin.counseling-cases.index'))
        ->assertSuccessful();
});

describe('cases table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $admin = User::factory()->admin()->create();
        CounselingCase::factory()->openedBy($admin)->create(['person_name' => 'Aaron Able', 'created_at' => now()->subDays(2)]);
        CounselingCase::factory()->openedBy($admin)->create(['person_name' => 'Zoe Zane', 'created_at' => now()->subDay()]);

        $this->actingAs($admin)->get(route('admin.counseling-cases.index', ['sort' => 'person', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('cases.data.0.person_name', 'Aaron Able')
                ->where('filters.sort', 'person'));

        $this->actingAs($admin)->get(route('admin.counseling-cases.index', ['sort' => 'presenting_issue', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page
                ->where('cases.data.0.person_name', 'Zoe Zane')
                ->where('filters.sort', null));
    });

    it('filters by several statuses and counselors at once', function () {
        $admin = User::factory()->admin()->create();
        $first = User::factory()->staff()->create();
        $second = User::factory()->staff()->create();
        CounselingCase::factory()->open()->assignedTo($first)->openedBy($admin)->create();
        CounselingCase::factory()->onHold()->assignedTo($second)->openedBy($admin)->create();
        CounselingCase::factory()->closedResolved()->openedBy($admin)->create();

        $this->actingAs($admin)->get(route('admin.counseling-cases.index', ['status' => ['open', 'on_hold']]))
            ->assertInertia(fn ($page) => $page->has('cases.data', 2));

        $this->actingAs($admin)->get(route('admin.counseling-cases.index', ['counselor_id' => [$first->id, $second->id]]))
            ->assertInertia(fn ($page) => $page->has('cases.data', 2)->where('filters.counselor_id', [(string) $first->id, (string) $second->id]));
    });

    it('never reveals cases outside the counselor visibility scope when sorting or filtering', function () {
        $admin = User::factory()->admin()->create();
        $counselor = User::factory()->staff()->create();
        $otherCounselor = User::factory()->staff()->create();
        $mine = CounselingCase::factory()->open()->assignedTo($counselor)->openedBy($admin)->create();
        CounselingCase::factory()->open()->assignedTo($otherCounselor)->openedBy($admin)->create();

        $this->actingAs($counselor)
            ->get(route('admin.counseling-cases.index', [
                'sort' => 'person',
                'direction' => 'desc',
                'status' => ['open'],
                'counselor_id' => [$otherCounselor->id, $counselor->id],
            ]))
            ->assertInertia(fn ($page) => $page
                ->has('cases.data', 1)
                ->where('cases.data.0.id', $mine->id)
                ->where('cases.meta.total', 1));
    });

    it('returns pagination meta for the table', function () {
        $admin = User::factory()->admin()->create();
        CounselingCase::factory()->count(16)->openedBy($admin)->create();

        $this->actingAs($admin)
            ->get(route('admin.counseling-cases.index'))
            ->assertInertia(fn ($page) => $page
                ->has('cases.data', 15)
                ->where('cases.meta.total', 16));
    });
});

describe('split view and confidentiality', function () {
    /**
     * A leader who sits on a governance body (e.g. Deacons Court).
     */
    function makeDeacon(): User
    {
        $deacon = User::factory()->leader()->create();
        $governance = \App\Models\Ministry::factory()->create(['is_governance_body' => true]);
        \App\Models\MinistryMember::factory()->create(['user_id' => $deacon->id, 'ministry_id' => $governance->id]);

        return $deacon;
    }

    $confidentialKeys = ['presenting_issue', 'background_notes', 'person_contact', 'person_email', 'referral_source', 'closure_reason', 'sessions', 'goals', 'referrals', 'case_documents'];

    it('loads the full selected case for an admin', function () {
        $admin = User::factory()->admin()->create();
        $case = CounselingCase::factory()->openedBy($admin)->create(['presenting_issue' => '<p>Private issue</p>']);

        $this->actingAs($admin)
            ->get(route('admin.counseling-cases.index', ['selected' => $case->id]))
            ->assertInertia(fn ($page) => $page
                ->where('selected.counselingCase.data.id', $case->id)
                ->where('selected.counselingCase.data.presenting_issue', '<p>Private issue</p>')
                ->where('selected.isDeaconView', false)
                ->where('filters.selected', (string) $case->id)
            );
    });

    it('never puts confidential fields in list rows', function () use ($confidentialKeys) {
        $admin = User::factory()->admin()->create();
        CounselingCase::factory()->openedBy($admin)->create();

        $this->actingAs($admin)
            ->get(route('admin.counseling-cases.index'))
            ->assertInertia(function ($page) use ($confidentialKeys) {
                $page->where('cases.data.0.is_summary', true);
                foreach ($confidentialKeys as $key) {
                    $page->missing("cases.data.0.{$key}");
                }
            });
    });

    it('does not let a counselor load another counselor\'s case through ?selected', function () {
        $admin = User::factory()->admin()->create();
        $mine = User::factory()->staff()->create();
        $other = User::factory()->staff()->create();
        CounselingCase::factory()->openedBy($admin)->assignedTo($mine)->create();
        $theirs = CounselingCase::factory()->openedBy($admin)->assignedTo($other)->create();

        $this->actingAs($mine)
            ->get(route('admin.counseling-cases.index', ['selected' => $theirs->id]))
            ->assertInertia(fn ($page) => $page->where('selected', null));

        $this->actingAs($mine)->get(route('admin.counseling-cases.show', $theirs))->assertForbidden();
    });

    it('gives a deacon only the summary, in the panel and on the show page', function () use ($confidentialKeys) {
        $admin = User::factory()->admin()->create();
        $case = CounselingCase::factory()->openedBy($admin)->assignedTo($admin)->create(['presenting_issue' => '<p>Private issue</p>']);
        $case->sessions()->create(['session_date' => now(), 'duration_minutes' => 60, 'session_type' => 'in_person', 'counselor_id' => $admin->id, 'notes' => 'Private session']);
        $deacon = makeDeacon();

        $assertSummary = function (string $prefix) use ($case, $confidentialKeys) {
            return function ($page) use ($prefix, $case, $confidentialKeys) {
                $page->where("{$prefix}.counselingCase.data.id", $case->id)
                    ->where("{$prefix}.counselingCase.data.is_summary", true)
                    ->where("{$prefix}.counselingCase.data.sessions_count", 1)
                    ->where("{$prefix}.isDeaconView", true);
                foreach ($confidentialKeys as $key) {
                    $page->missing("{$prefix}.counselingCase.data.{$key}");
                }
            };
        };

        $this->actingAs($deacon)
            ->get(route('admin.counseling-cases.index', ['selected' => $case->id]))
            ->assertInertia($assertSummary('selected'));

        $response = $this->actingAs($deacon)->get(route('admin.counseling-cases.show', $case));
        $response->assertSuccessful()->assertInertia(fn ($page) => $page
            ->where('counselingCase.data.is_summary', true)
            ->missing('counselingCase.data.presenting_issue')
            ->missing('counselingCase.data.sessions')
            ->where('isDeaconView', true));
        expect($response->getContent())->not->toContain('Private issue')->not->toContain('Private session');
    });

    it('keeps plain leaders and members out entirely', function () {
        $admin = User::factory()->admin()->create();
        $case = CounselingCase::factory()->openedBy($admin)->create();

        foreach ([User::factory()->leader()->create(), User::factory()->create()] as $user) {
            $this->actingAs($user)->get(route('admin.counseling-cases.index', ['selected' => $case->id]))->assertForbidden();
            $this->actingAs($user)->get(route('admin.counseling-cases.show', $case))->assertForbidden();
        }
    });

    it('returns only the panel on a partial reload', function () {
        $admin = User::factory()->admin()->create();
        $case = CounselingCase::factory()->openedBy($admin)->create();

        $this->actingAs($admin)
            ->get(route('admin.counseling-cases.index', ['selected' => $case->id]))
            ->assertInertia(fn ($page) => $page
                ->reloadOnly('selected', fn ($reload) => $reload
                    ->where('selected.counselingCase.data.id', $case->id)
                    ->missing('cases')
                )
            );
    });

    it('keeps the case selected after logging a session from the panel', function () {
        $admin = User::factory()->admin()->create();
        $case = CounselingCase::factory()->openedBy($admin)->create();
        $listUrl = route('admin.counseling-cases.index', ['selected' => $case->id]);

        $this->actingAs($admin)
            ->from($listUrl)
            ->post(route('admin.counseling-cases.sessions', $case), [
                'session_date' => now()->toDateTimeString(),
                'duration_minutes' => 50,
                'session_type' => 'in_person',
            ])
            ->assertRedirect($listUrl);

        expect($case->sessions()->count())->toBe(1);
    });

    it('serves the full show page to the assigned counselor', function () {
        $admin = User::factory()->admin()->create();
        $counselor = User::factory()->staff()->create();
        $case = CounselingCase::factory()->openedBy($admin)->assignedTo($counselor)->create();

        $this->actingAs($counselor)
            ->get(route('admin.counseling-cases.show', $case))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('admin/counseling-cases/show')
                ->where('counselingCase.data.id', $case->id)
                ->has('counselingCase.data.presenting_issue')
                ->has('counselingCase.data.sessions')
                ->where('isDeaconView', false)
                ->has('sessionTypes')
            );
    });
});
