<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Enums\GoalStatus;
use App\Enums\ReferralType;
use App\Enums\SessionType;
use App\Http\Controllers\Concerns\ReadsTableQuery;
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
    use ReadsTableQuery;

    /**
     * Sortable columns for the cases table; the default is newest first.
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'case_number' => 'case_number',
        'person' => 'person_name',
        'type' => 'case_type',
        'status' => 'status',
        'opened_at' => 'opened_at',
    ];

    /**
     * Display a listing of counseling cases.
     * Staff+ see full details via scopeVisibleTo. Deacons see summary view.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isDeacon = $user->isDeacon();
        $isCounselor = $user->isCounselor();

        abort_unless($user->isStaffOrAbove() || $isDeacon || $isCounselor, 403);

        $statuses = $this->listInput($request, 'status');
        $caseTypes = $this->listInput($request, 'case_type');
        $counselorIds = $this->listInput($request, 'counselor_id');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE, 'desc');

        // visibleTo() is applied first so sorting and filtering only ever work
        // within the cases this user is allowed to see.
        $cases = CounselingCase::query()
            ->visibleTo($user)
            ->with(['assignedCounselor'])
            ->withCount('sessions')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('person_name', 'like', "%{$search}%")
                        ->orWhere('case_number', 'like', "%{$search}%");
                });
            })
            ->when($statuses, fn ($query) => $query->whereIn('status', $statuses))
            ->when($caseTypes, fn ($query) => $query->whereIn('case_type', $caseTypes))
            ->when($counselorIds, fn ($query) => $query->whereIn('assigned_counselor_id', $counselorIds))
            ->when($sort, fn ($query) => $query->orderBy(self::SORTABLE[$sort], $direction))
            ->latest()
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            'search' => $request->input('search'),
            'status' => $statuses,
            'case_type' => $caseTypes,
            'counselor_id' => $counselorIds,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Counseling cases listing viewed', ['user_id' => $user->id, 'filters' => $filters]);

        return Inertia::render('admin/counseling-cases/index', [
            'cases' => CounselingCaseResource::collection($cases),
            'filters' => $filters,
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
            'isAdmin' => $user->isAdmin(),
            'isDeaconView' => $isDeacon && ! $user->isStaffOrAbove(),
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

    /**
     * Show a counseling case.
     * Staff+ see full details. Deacons see summary (status, type, counselor — not presenting_issue, background_notes).
     */
    public function show(Request $request, CounselingCase $counselingCase): Response
    {
        $user = $request->user();
        $isDeacon = $user->isDeacon();

        // Deacons see summary view; all others must pass case visibility check
        if (! $isDeacon) {
            abort_unless($counselingCase->isVisibleTo($user), 403);
        }

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
            'isAdmin' => $user->isAdmin(),
            'isDeaconView' => $isDeacon && ! $user->isStaffOrAbove(),
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
