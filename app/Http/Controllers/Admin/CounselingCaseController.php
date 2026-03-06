<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Enums\GoalStatus;
use App\Enums\ReferralType;
use App\Enums\SessionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCounselingCaseRequest;
use App\Http\Requests\Admin\StoreCounselingGoalRequest;
use App\Http\Requests\Admin\StoreCounselingReferralRequest;
use App\Http\Requests\Admin\StoreCounselingSessionRequest;
use App\Http\Resources\CounselingCaseResource;
use App\Models\CounselingCase;
use App\Models\CounselingGoal;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CounselingCaseController extends Controller
{
    public function index(Request $request): Response
    {
        $cases = CounselingCase::query()
            ->visibleTo($request->user())
            ->with(['assignedCounselor'])
            ->withCount('sessions')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('person_name', 'like', "%{$search}%")
                        ->orWhere('case_number', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->input('case_type'), function ($query, $caseType) {
                $query->where('case_type', $caseType);
            })
            ->when($request->input('counselor_id'), function ($query, $counselorId) {
                $query->where('assigned_counselor_id', $counselorId);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/counseling-cases/index', [
            'cases' => CounselingCaseResource::collection($cases),
            'filters' => $request->only(['search', 'status', 'case_type', 'counselor_id']),
            'statuses' => collect(CaseStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'caseTypes' => collect(CaseType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'counselors' => User::query()
                ->whereIn('role', ['admin', 'staff'])
                ->orderBy('name')
                ->get(['id', 'name']),
            'isAdmin' => $request->user()->isAdmin(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/counseling-cases/create', [
            'caseTypes' => collect(CaseType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'counselors' => User::query()
                ->whereIn('role', ['admin', 'staff'])
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreCounselingCaseRequest $request): RedirectResponse
    {
        $case = CounselingCase::create([
            ...$request->validated(),
            'opened_by' => $request->user()->id,
            'opened_at' => now(),
        ]);

        Log::info('Counseling case created', [
            'case_id' => $case->id,
            'case_number' => $case->case_number,
            'person_name' => $case->person_name,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.counseling-cases.show', $case)
            ->with('success', "Case {$case->case_number} created.");
    }

    public function show(Request $request, CounselingCase $counselingCase): Response
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);

        $counselingCase->load([
            'assignedCounselor',
            'openedBy',
            'sessions.counselor',
            'goals.createdBy',
            'referrals.referredBy',
        ]);

        return Inertia::render('admin/counseling-cases/show', [
            'counselingCase' => CounselingCaseResource::make($counselingCase),
            'statuses' => collect(CaseStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'sessionTypes' => collect(SessionType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'goalStatuses' => collect(GoalStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'referralTypes' => collect(ReferralType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'isAdmin' => $request->user()->isAdmin(),
        ]);
    }

    public function edit(Request $request, CounselingCase $counselingCase): Response
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);

        $counselingCase->load(['assignedCounselor']);

        return Inertia::render('admin/counseling-cases/edit', [
            'counselingCase' => CounselingCaseResource::make($counselingCase),
            'caseTypes' => collect(CaseType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'statuses' => collect(CaseStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'counselors' => User::query()
                ->whereIn('role', ['admin', 'staff'])
                ->orderBy('name')
                ->get(['id', 'name']),
            'isAdmin' => $request->user()->isAdmin(),
        ]);
    }

    public function update(StoreCounselingCaseRequest $request, CounselingCase $counselingCase): RedirectResponse
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);

        $data = $request->validated();

        $newStatus = CaseStatus::from($data['status'] ?? $counselingCase->status->value);
        if ($newStatus->isClosed() && ! $counselingCase->status->isClosed()) {
            $data['closed_at'] = now();
        }

        $counselingCase->update($data);

        Log::info('Counseling case updated', [
            'case_id' => $counselingCase->id,
            'case_number' => $counselingCase->case_number,
            'status' => $counselingCase->status->value,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.counseling-cases.show', $counselingCase)
            ->with('success', 'Case updated.');
    }

    public function destroy(Request $request, CounselingCase $counselingCase): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $caseNumber = $counselingCase->case_number;
        $caseId = $counselingCase->id;

        $counselingCase->delete();

        Log::info('Counseling case deleted', [
            'case_id' => $caseId,
            'case_number' => $caseNumber,
            'deleted_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.counseling-cases.index')
            ->with('success', "Case {$caseNumber} deleted.");
    }

    public function addSession(StoreCounselingSessionRequest $request, CounselingCase $counselingCase): RedirectResponse
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);

        $session = $counselingCase->sessions()->create([
            ...$request->safe()->except('session_document'),
            'counselor_id' => $request->user()->id,
        ]);

        if ($request->hasFile('session_document')) {
            $session->addMedia($request->file('session_document'))->toMediaCollection('session_documents');
        }

        Log::info('Counseling session logged', [
            'case_id' => $counselingCase->id,
            'session_id' => $session->id,
            'counselor_id' => $request->user()->id,
            'session_type' => $session->session_type->value,
        ]);

        return redirect()->back()
            ->with('success', 'Session logged.');
    }

    public function addGoal(StoreCounselingGoalRequest $request, CounselingCase $counselingCase): RedirectResponse
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);

        $maxPriority = $counselingCase->goals()->max('priority') ?? 0;

        $goal = $counselingCase->goals()->create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
            'priority' => $maxPriority + 1,
        ]);

        Log::info('Counseling goal added', [
            'case_id' => $counselingCase->id,
            'goal_id' => $goal->id,
            'title' => $goal->title,
            'added_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Goal added.');
    }

    public function updateGoal(StoreCounselingGoalRequest $request, CounselingCase $counselingCase, CounselingGoal $goal): RedirectResponse
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);
        abort_unless($goal->counseling_case_id === $counselingCase->id, 404);

        $goal->update($request->validated());

        Log::info('Counseling goal updated', [
            'case_id' => $counselingCase->id,
            'goal_id' => $goal->id,
            'status' => $goal->status->value,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Goal updated.');
    }

    public function addReferral(StoreCounselingReferralRequest $request, CounselingCase $counselingCase): RedirectResponse
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);

        $referral = $counselingCase->referrals()->create([
            ...$request->safe()->except('referral_document'),
            'referred_by' => $request->user()->id,
        ]);

        if ($request->hasFile('referral_document')) {
            $referral->addMedia($request->file('referral_document'))->toMediaCollection('referral_documents');
        }

        Log::info('Counseling referral added', [
            'case_id' => $counselingCase->id,
            'referral_id' => $referral->id,
            'referral_type' => $referral->referral_type->value,
            'added_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Referral recorded.');
    }

    public function addAttachments(Request $request, CounselingCase $counselingCase): RedirectResponse
    {
        abort_unless($counselingCase->isVisibleTo($request->user()), 403);

        $request->validate([
            'documents' => ['required', 'array', 'min:1', 'max:10'],
            'documents.*' => ['file', 'max:20480', 'mimes:pdf,doc,docx,jpg,jpeg,png,gif,webp'],
        ]);

        foreach ($request->file('documents') as $file) {
            $counselingCase->addMedia($file)->toMediaCollection('case_documents');
        }

        Log::info('Documents added to counseling case', [
            'case_id' => $counselingCase->id,
            'file_count' => count($request->file('documents')),
            'added_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Documents uploaded.');
    }
}
