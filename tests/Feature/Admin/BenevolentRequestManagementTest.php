<?php

use App\Enums\BenevolentCategory;
use App\Enums\BenevolentStatus;
use App\Enums\BenevolentUrgency;
use App\Enums\DisbursementMethod;
use App\Enums\ReviewRecommendation;
use App\Models\BenevolentDisbursement;
use App\Models\BenevolentRequest;
use App\Models\BenevolentReview;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('denies member access to benevolent requests', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.benevolent-requests.index'))
        ->assertForbidden();
});

it('allows staff to view benevolent requests listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.benevolent-requests.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/benevolent-requests/index')
            ->has('requests')
            ->has('filters')
            ->has('statuses')
            ->has('categories')
            ->has('urgencies')
        );
});

it('searches benevolent requests by requester name', function () {
    $staff = User::factory()->staff()->create();
    BenevolentRequest::factory()->createdBy($staff)->create(['requester_name' => 'John Smith']);
    BenevolentRequest::factory()->createdBy($staff)->create(['requester_name' => 'Jane Doe']);

    $this->actingAs($staff)
        ->get(route('admin.benevolent-requests.index', ['search' => 'John']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('requests.data', 1)
        );
});

it('filters benevolent requests by status', function () {
    $staff = User::factory()->staff()->create();
    BenevolentRequest::factory()->pending()->createdBy($staff)->create();
    BenevolentRequest::factory()->approved()->createdBy($staff)->create();
    BenevolentRequest::factory()->approved()->createdBy($staff)->create();

    $this->actingAs($staff)
        ->get(route('admin.benevolent-requests.index', ['status' => 'approved']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('requests.data', 2)
        );
});

it('filters benevolent requests by category', function () {
    $staff = User::factory()->staff()->create();
    BenevolentRequest::factory()->createdBy($staff)->create(['category' => BenevolentCategory::Medical]);
    BenevolentRequest::factory()->createdBy($staff)->create(['category' => BenevolentCategory::Food]);

    $this->actingAs($staff)
        ->get(route('admin.benevolent-requests.index', ['category' => 'medical']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('requests.data', 1)
        );
});

it('filters benevolent requests by urgency', function () {
    $staff = User::factory()->staff()->create();
    BenevolentRequest::factory()->createdBy($staff)->create(['urgency' => BenevolentUrgency::Critical]);
    BenevolentRequest::factory()->createdBy($staff)->create(['urgency' => BenevolentUrgency::Low]);

    $this->actingAs($staff)
        ->get(route('admin.benevolent-requests.index', ['urgency' => 'critical']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('requests.data', 1)
        );
});

it('shows the create benevolent request page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.benevolent-requests.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/benevolent-requests/create')
            ->has('categories')
            ->has('urgencies')
        );
});

it('creates a benevolent request', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.benevolent-requests.store'), [
            'requester_name' => 'Jane Smith',
            'requester_contact' => '555-0123',
            'category' => BenevolentCategory::Medical->value,
            'description' => 'Needs help with medical bills.',
            'amount_requested' => 1500.00,
            'urgency' => BenevolentUrgency::High->value,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('benevolent_requests', [
        'requester_name' => 'Jane Smith',
        'category' => BenevolentCategory::Medical->value,
        'created_by' => $staff->id,
    ]);
});

it('validates required fields when creating a request', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.benevolent-requests.store'), [])
        ->assertSessionHasErrors(['requester_name', 'category', 'description', 'urgency']);
});

it('creates a benevolent request with evidence files', function () {
    Storage::fake('media');
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.benevolent-requests.store'), [
            'requester_name' => 'John Doe',
            'category' => BenevolentCategory::Housing->value,
            'description' => 'Housing assistance needed.',
            'urgency' => BenevolentUrgency::Medium->value,
            'evidence' => [
                UploadedFile::fake()->create('receipt.pdf', 1024, 'application/pdf'),
            ],
        ])
        ->assertRedirect();

    $request = BenevolentRequest::first();
    expect($request->getMedia('evidence'))->toHaveCount(1);
});

it('shows the benevolent request detail page', function () {
    $staff = User::factory()->staff()->create();
    $request = BenevolentRequest::factory()->createdBy($staff)->create();

    $this->actingAs($staff)
        ->get(route('admin.benevolent-requests.show', $request))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/benevolent-requests/show')
            ->has('benevolentRequest')
            ->has('statuses')
            ->has('recommendations')
            ->has('disbursementMethods')
        );
});

it('adds a committee review', function () {
    $staff = User::factory()->staff()->create();
    $request = BenevolentRequest::factory()->createdBy($staff)->create();

    $this->actingAs($staff)
        ->post(route('admin.benevolent-requests.review', $request), [
            'recommendation' => ReviewRecommendation::Approve->value,
            'amount_recommended' => 1000.00,
            'comments' => 'This is a legitimate need.',
            'reviewed_at' => now()->toDateString(),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('benevolent_reviews', [
        'benevolent_request_id' => $request->id,
        'user_id' => $staff->id,
        'recommendation' => ReviewRecommendation::Approve->value,
    ]);
});

it('updates status to under_review after first review on pending request', function () {
    $staff = User::factory()->staff()->create();
    $request = BenevolentRequest::factory()->pending()->createdBy($staff)->create();

    $this->actingAs($staff)
        ->post(route('admin.benevolent-requests.review', $request), [
            'recommendation' => ReviewRecommendation::Approve->value,
            'reviewed_at' => now()->toDateString(),
        ]);

    expect($request->fresh()->status)->toBe(BenevolentStatus::UnderReview);
});

it('allows reviewer to update their existing review (upsert)', function () {
    $staff = User::factory()->staff()->create();
    $request = BenevolentRequest::factory()->underReview()->createdBy($staff)->create();

    BenevolentReview::factory()->create([
        'benevolent_request_id' => $request->id,
        'user_id' => $staff->id,
        'recommendation' => ReviewRecommendation::NeedsMoreInfo,
    ]);

    $this->actingAs($staff)
        ->post(route('admin.benevolent-requests.review', $request), [
            'recommendation' => ReviewRecommendation::Approve->value,
            'amount_recommended' => 500.00,
            'reviewed_at' => now()->toDateString(),
        ])
        ->assertRedirect();

    expect($request->reviews()->where('user_id', $staff->id)->count())->toBe(1);
    expect($request->reviews()->where('user_id', $staff->id)->first()->recommendation)
        ->toBe(ReviewRecommendation::Approve);
});

it('makes a final decision to approve', function () {
    $admin = User::factory()->admin()->create();
    $request = BenevolentRequest::factory()->underReview()->createdBy($admin)->create();

    $this->actingAs($admin)
        ->post(route('admin.benevolent-requests.decide', $request), [
            'status' => BenevolentStatus::Approved->value,
            'amount_approved' => 1200.00,
            'final_decision_notes' => 'Approved by committee.',
        ])
        ->assertRedirect();

    $request->refresh();
    expect($request->status)->toBe(BenevolentStatus::Approved);
    expect($request->amount_approved)->toBe('1200.00');
    expect($request->final_decision_by)->toBe($admin->id);
    expect($request->final_decision_at)->not->toBeNull();
});

it('makes a final decision to deny', function () {
    $admin = User::factory()->admin()->create();
    $request = BenevolentRequest::factory()->underReview()->createdBy($admin)->create();

    $this->actingAs($admin)
        ->post(route('admin.benevolent-requests.decide', $request), [
            'status' => BenevolentStatus::Denied->value,
            'final_decision_notes' => 'Does not meet criteria.',
        ])
        ->assertRedirect();

    expect($request->fresh()->status)->toBe(BenevolentStatus::Denied);
});

it('requires amount_approved when approving', function () {
    $admin = User::factory()->admin()->create();
    $request = BenevolentRequest::factory()->underReview()->createdBy($admin)->create();

    $this->actingAs($admin)
        ->post(route('admin.benevolent-requests.decide', $request), [
            'status' => BenevolentStatus::Approved->value,
        ])
        ->assertSessionHasErrors('amount_approved');
});

it('records a disbursement for approved request', function () {
    $admin = User::factory()->admin()->create();
    $request = BenevolentRequest::factory()->approved()->createdBy($admin)->create([
        'amount_approved' => 1000.00,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.benevolent-requests.disburse', $request), [
            'amount' => 500.00,
            'method' => DisbursementMethod::Cash->value,
            'reference_number' => 'REF-001',
            'disbursed_at' => now()->toDateString(),
            'notes' => 'First payment.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('benevolent_disbursements', [
        'benevolent_request_id' => $request->id,
        'amount' => 500.00,
        'disbursed_by' => $admin->id,
    ]);
});

it('prevents disbursement on non-approved request', function () {
    $admin = User::factory()->admin()->create();
    $request = BenevolentRequest::factory()->pending()->createdBy($admin)->create();

    $this->actingAs($admin)
        ->post(route('admin.benevolent-requests.disburse', $request), [
            'amount' => 100.00,
            'method' => DisbursementMethod::Cash->value,
            'disbursed_at' => now()->toDateString(),
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});

it('auto-transitions to disbursed when total meets approved amount', function () {
    $admin = User::factory()->admin()->create();
    $request = BenevolentRequest::factory()->approved()->createdBy($admin)->create([
        'amount_approved' => 500.00,
    ]);

    BenevolentDisbursement::factory()->create([
        'benevolent_request_id' => $request->id,
        'amount' => 300.00,
        'disbursed_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.benevolent-requests.disburse', $request), [
            'amount' => 200.00,
            'method' => DisbursementMethod::Check->value,
            'disbursed_at' => now()->toDateString(),
        ])
        ->assertRedirect();

    expect($request->fresh()->status)->toBe(BenevolentStatus::Disbursed);
});

it('uploads additional evidence files', function () {
    Storage::fake('media');
    $staff = User::factory()->staff()->create();
    $request = BenevolentRequest::factory()->createdBy($staff)->create();

    $this->actingAs($staff)
        ->post(route('admin.benevolent-requests.attachments', $request), [
            'evidence' => [
                UploadedFile::fake()->create('doc1.pdf', 1024, 'application/pdf'),
                UploadedFile::fake()->image('photo.jpg'),
            ],
        ])
        ->assertRedirect();

    expect($request->getMedia('evidence'))->toHaveCount(2);
});

it('deletes a benevolent request', function () {
    $admin = User::factory()->admin()->create();
    $request = BenevolentRequest::factory()->createdBy($admin)->create();

    $this->actingAs($admin)
        ->delete(route('admin.benevolent-requests.destroy', $request))
        ->assertRedirect(route('admin.benevolent-requests.index'));

    $this->assertDatabaseMissing('benevolent_requests', ['id' => $request->id]);
});

it('calculates total disbursed correctly', function () {
    $staff = User::factory()->staff()->create();
    $request = BenevolentRequest::factory()->approved()->createdBy($staff)->create();

    BenevolentDisbursement::factory()->create([
        'benevolent_request_id' => $request->id,
        'amount' => 200.00,
        'disbursed_by' => $staff->id,
    ]);
    BenevolentDisbursement::factory()->create([
        'benevolent_request_id' => $request->id,
        'amount' => 300.00,
        'disbursed_by' => $staff->id,
    ]);

    expect($request->totalDisbursed())->toBe(500.0);
});

it('denies leader without deacon status from benevolent requests', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->get(route('admin.benevolent-requests.index'))
        ->assertForbidden();
});

it('allows leader with deacon status to access benevolent requests', function () {
    $leader = User::factory()->leader()->create();
    $governance = \App\Models\Ministry::factory()->create(['is_governance_body' => true]);
    \App\Models\MinistryMember::factory()->create(['user_id' => $leader->id, 'ministry_id' => $governance->id]);

    $this->actingAs($leader)
        ->get(route('admin.benevolent-requests.index'))
        ->assertSuccessful();
});
