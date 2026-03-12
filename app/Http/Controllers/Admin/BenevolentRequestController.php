<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BenevolentCategory;
use App\Enums\BenevolentStatus;
use App\Enums\BenevolentUrgency;
use App\Enums\DisbursementMethod;
use App\Enums\ReviewRecommendation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBenevolentDecisionRequest;
use App\Http\Requests\Admin\StoreBenevolentDisbursementRequest;
use App\Http\Requests\Admin\StoreBenevolentRequestRequest;
use App\Http\Requests\Admin\StoreBenevolentReviewRequest;
use App\Http\Resources\BenevolentRequestResource;
use App\Models\BenevolentRequest;
use App\Notifications\BenevolenceStatusUpdate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class BenevolentRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $requests = BenevolentRequest::query()
            ->with(['creator'])
            ->withCount('reviews')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('requester_name', 'like', "%{$search}%")
                        ->orWhere('requester_contact', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->input('category'), function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->input('urgency'), function ($query, $urgency) {
                $query->where('urgency', $urgency);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/benevolent-requests/index', [
            'requests' => BenevolentRequestResource::collection($requests),
            'filters' => $request->only(['search', 'status', 'category', 'urgency']),
            'statuses' => collect(BenevolentStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'categories' => collect(BenevolentCategory::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
            'urgencies' => collect(BenevolentUrgency::cases())->map(fn ($u) => [
                'value' => $u->value,
                'label' => $u->label(),
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/benevolent-requests/create', [
            'categories' => collect(BenevolentCategory::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
            'urgencies' => collect(BenevolentUrgency::cases())->map(fn ($u) => [
                'value' => $u->value,
                'label' => $u->label(),
            ]),
        ]);
    }

    public function store(StoreBenevolentRequestRequest $request): RedirectResponse
    {
        $benevolentRequest = BenevolentRequest::create([
            ...$request->safe()->except('evidence'),
            'created_by' => $request->user()->id,
        ]);

        if ($request->hasFile('evidence')) {
            foreach ($request->file('evidence') as $file) {
                $benevolentRequest->addMedia($file)->toMediaCollection('evidence');
            }
        }

        Log::info('Benevolent request created', [
            'request_id' => $benevolentRequest->id,
            'requester' => $benevolentRequest->requester_name,
            'category' => $benevolentRequest->category->value,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.benevolent-requests.show', $benevolentRequest)
            ->with('success', 'Benevolent request created.');
    }

    public function show(BenevolentRequest $benevolentRequest): Response
    {
        $benevolentRequest->load([
            'creator',
            'finalDecisionBy',
            'reviews.reviewer',
            'disbursements.disbursedBy',
            'media',
        ]);

        return Inertia::render('admin/benevolent-requests/show', [
            'benevolentRequest' => BenevolentRequestResource::make($benevolentRequest),
            'statuses' => collect([
                BenevolentStatus::Approved,
                BenevolentStatus::PartiallyApproved,
                BenevolentStatus::Denied,
                BenevolentStatus::Closed,
            ])->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'recommendations' => collect(ReviewRecommendation::cases())->map(fn ($r) => [
                'value' => $r->value,
                'label' => $r->label(),
            ]),
            'disbursementMethods' => collect(DisbursementMethod::cases())->map(fn ($m) => [
                'value' => $m->value,
                'label' => $m->label(),
            ]),
        ]);
    }

    public function addReview(StoreBenevolentReviewRequest $request, BenevolentRequest $benevolentRequest): RedirectResponse
    {
        $benevolentRequest->reviews()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                ...$request->validated(),
                'user_id' => $request->user()->id,
            ],
        );

        if ($benevolentRequest->isPending()) {
            $benevolentRequest->update(['status' => BenevolentStatus::UnderReview]);
        }

        Log::info('Benevolent request review submitted', [
            'request_id' => $benevolentRequest->id,
            'reviewer_id' => $request->user()->id,
            'recommendation' => $request->validated('recommendation'),
        ]);

        return redirect()->back()
            ->with('success', 'Review submitted.');
    }

    public function decide(StoreBenevolentDecisionRequest $request, BenevolentRequest $benevolentRequest): RedirectResponse
    {
        $benevolentRequest->update([
            'status' => $request->validated('status'),
            'amount_approved' => $request->validated('amount_approved'),
            'final_decision_by' => $request->user()->id,
            'final_decision_at' => now(),
            'final_decision_notes' => $request->validated('final_decision_notes'),
        ]);

        if ($benevolentRequest->creator) {
            $benevolentRequest->creator->notify(new BenevolenceStatusUpdate($benevolentRequest));
        }

        Log::info('Benevolent request decision made', [
            'request_id' => $benevolentRequest->id,
            'status' => $request->validated('status'),
            'amount_approved' => $request->validated('amount_approved'),
            'decided_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Decision recorded.');
    }

    public function disburse(StoreBenevolentDisbursementRequest $request, BenevolentRequest $benevolentRequest): RedirectResponse
    {
        if (! in_array($benevolentRequest->status, [BenevolentStatus::Approved, BenevolentStatus::PartiallyApproved])) {
            return redirect()->back()
                ->with('error', 'Disbursements can only be made for approved requests.');
        }

        $disbursement = $benevolentRequest->disbursements()->create([
            ...$request->validated(),
            'disbursed_by' => $request->user()->id,
        ]);

        $totalDisbursed = $benevolentRequest->totalDisbursed();
        if ($benevolentRequest->amount_approved && $totalDisbursed >= (float) $benevolentRequest->amount_approved) {
            $benevolentRequest->update(['status' => BenevolentStatus::Disbursed]);
        }

        Log::info('Benevolent request disbursement recorded', [
            'request_id' => $benevolentRequest->id,
            'disbursement_id' => $disbursement->id,
            'amount' => $disbursement->amount,
            'method' => $disbursement->method->value,
            'disbursed_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Disbursement recorded.');
    }

    public function addAttachments(Request $request, BenevolentRequest $benevolentRequest): RedirectResponse
    {
        $request->validate([
            'evidence' => ['required', 'array', 'min:1', 'max:10'],
            'evidence.*' => ['file', 'max:20480', 'mimes:pdf,doc,docx,jpg,jpeg,png,gif,webp'],
        ]);

        foreach ($request->file('evidence') as $file) {
            $benevolentRequest->addMedia($file)->toMediaCollection('evidence');
        }

        Log::info('Evidence files added to benevolent request', [
            'request_id' => $benevolentRequest->id,
            'file_count' => count($request->file('evidence')),
            'added_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Files uploaded.');
    }

    public function destroy(BenevolentRequest $benevolentRequest): RedirectResponse
    {
        $requestId = $benevolentRequest->id;
        $requesterName = $benevolentRequest->requester_name;

        $benevolentRequest->delete();

        Log::info('Benevolent request deleted', [
            'request_id' => $requestId,
            'requester' => $requesterName,
        ]);

        return redirect()->route('admin.benevolent-requests.index')
            ->with('success', "Benevolent request for \"{$requesterName}\" deleted.");
    }
}
