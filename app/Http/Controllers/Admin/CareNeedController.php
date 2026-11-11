<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CareNeedPriority;
use App\Enums\CareNeedSource;
use App\Enums\CareNeedStatus;
use App\Enums\CareNeedType;
use App\Enums\ContactMethod;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignCareNeedTaskRequest;
use App\Http\Requests\Admin\EscalateCareNeedRequest;
use App\Http\Requests\Admin\StoreCareNeedRequest;
use App\Http\Requests\Admin\StoreCareNeedTaskRequest;
use App\Http\Requests\Admin\StoreCareNeedUpdateRequest;
use App\Http\Resources\CareNeedResource;
use App\Models\CareNeed;
use App\Models\CareNeedTask;
use App\Models\CareNeedUpdate;
use App\Models\Member;
use App\Models\User;
use App\Services\CareNeedService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class CareNeedController extends Controller
{
    public function __construct(private CareNeedService $careNeedService) {}

    /**
     * Care needs list. Defaults to needs that still need action.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $status = $request->input('status', 'active');

        $careNeeds = CareNeed::query()
            ->visibleTo($user)
            ->with(['member', 'assignee'])
            ->withCount('tasks')
            ->when($status === 'active', fn (Builder $q) => $q->active())
            ->when($status !== 'active' && $status !== 'all', fn (Builder $q) => $q->where('status', $status))
            ->when($request->input('type'), fn (Builder $q, string $type) => $q->where('type', $type))
            ->when($request->input('priority'), fn (Builder $q, string $priority) => $q->where('priority', $priority))
            ->when($request->input('assigned') === 'me', fn (Builder $q) => $q->where('assigned_to', $user->id))
            ->when($request->input('assigned') === 'unassigned', fn (Builder $q) => $q->whereNull('assigned_to'))
            ->when($request->boolean('overdue'), fn (Builder $q) => $q->overdue())
            ->when($request->input('search'), fn (Builder $q, string $search) => $q->where(fn (Builder $inner) => $inner
                ->where('title', 'like', "%{$search}%")
                ->orWhere('requester_name', 'like', "%{$search}%")
                ->orWhereHas('member', fn (Builder $m) => $m->search($search))))
            ->orderByRaw("case priority when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end")
            ->orderByRaw('due_on is null')
            ->orderBy('due_on')
            ->latest()
            ->paginate(20)
            ->withQueryString();

        Log::info('Care needs listing viewed', [
            'user_id' => $user->id,
            'filters' => $request->only(['status', 'type', 'priority', 'assigned', 'overdue', 'search']),
        ]);

        return Inertia::render('admin/care-needs/index', [
            'careNeeds' => CareNeedResource::collection($careNeeds),
            'filters' => [...$request->only(['type', 'priority', 'assigned', 'overdue', 'search', 'selected']), 'status' => $status],
            'counts' => [
                'active' => CareNeed::query()->visibleTo($user)->active()->count(),
                'mine' => CareNeed::query()->visibleTo($user)->active()->where('assigned_to', $user->id)->count(),
                'overdue' => CareNeed::query()->visibleTo($user)->overdue()->count(),
            ],
            // Split view: the need open in the right-hand panel. Clicking a row
            // reloads only this prop, so the list keeps its scroll and filters.
            'selected' => fn () => $this->selectedDetail($request, $user),
            ...$this->options(),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->isLeaderOrAbove(), 403);

        return Inertia::render('admin/care-needs/create', [
            ...$this->options(),
            'members' => $this->memberOptions($request->user()),
            'preselectedMemberId' => $request->integer('member_id') ?: null,
        ]);
    }

    public function store(StoreCareNeedRequest $request): RedirectResponse
    {
        $careNeed = $this->careNeedService->create(
            [...$request->safe()->except('status'), 'source' => CareNeedSource::Manual],
            $request->user(),
        );

        return redirect()->route('admin.care-needs.show', $careNeed)
            ->with('success', 'Care need added.');
    }

    public function show(Request $request, CareNeed $careNeed): Response
    {
        abort_unless($careNeed->isVisibleTo($request->user()), 403);

        return Inertia::render('admin/care-needs/show', [
            ...$this->detail($careNeed, $request->user()),
            ...$this->options(),
        ]);
    }

    public function edit(Request $request, CareNeed $careNeed): Response
    {
        abort_unless($careNeed->isVisibleTo($request->user()), 403);

        return Inertia::render('admin/care-needs/edit', [
            'careNeed' => new CareNeedResource($careNeed),
            ...$this->options(),
            'members' => $this->memberOptions($request->user()),
        ]);
    }

    public function update(StoreCareNeedRequest $request, CareNeed $careNeed): RedirectResponse
    {
        $this->careNeedService->update($careNeed, $request->validated(), $request->user());

        return redirect()->route('admin.care-needs.show', $careNeed)
            ->with('success', 'Care need updated.');
    }

    public function destroy(Request $request, CareNeed $careNeed): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove() && $careNeed->isVisibleTo($request->user()), 403);

        $careNeedId = $careNeed->id;
        $careNeed->delete();

        Log::info('Care need deleted', ['care_need_id' => $careNeedId, 'deleted_by' => $request->user()->id]);

        return redirect()->route('admin.care-needs.index')->with('success', 'Care need deleted.');
    }

    public function addUpdate(StoreCareNeedUpdateRequest $request, CareNeed $careNeed): RedirectResponse
    {
        $this->careNeedService->addUpdate(
            $careNeed,
            $request->validated('body'),
            ContactMethod::from($request->validated('contact_method')),
            $request->user(),
            CareNeedStatus::tryFrom((string) $request->validated('status')),
        );

        return redirect()->back()->with('success', 'Update added.');
    }

    public function escalate(EscalateCareNeedRequest $request, CareNeed $careNeed): RedirectResponse
    {
        if ($careNeed->status === CareNeedStatus::Escalated) {
            return redirect()->back()->with('info', 'This need has already been escalated.');
        }

        if ($request->validated('target') === 'benevolence') {
            $benevolentRequest = $this->careNeedService->escalateToBenevolence(
                $careNeed,
                $request->user(),
                $request->filled('amount_requested') ? (float) $request->validated('amount_requested') : null,
            );

            return redirect()->route('admin.benevolent-requests.show', $benevolentRequest)
                ->with('success', 'Benevolence request created from care need.');
        }

        $case = $this->careNeedService->escalateToCounseling($careNeed, $request->user());

        return redirect()->route('admin.counseling-cases.show', $case)
            ->with('success', "Counseling case {$case->case_number} opened from care need.");
    }

    public function storeTask(StoreCareNeedTaskRequest $request, CareNeed $careNeed): RedirectResponse
    {
        $this->careNeedService->addTask($careNeed, $request->validated('description'), $request->validated('due_on'), $request->user());

        return redirect()->back()->with('success', 'Task added.');
    }

    public function assignTask(AssignCareNeedTaskRequest $request, CareNeed $careNeed, CareNeedTask $task): RedirectResponse
    {
        abort_unless($task->care_need_id === $careNeed->id, 404);

        $volunteerId = $request->validated('volunteer_id');
        $this->careNeedService->assignTask($task, $volunteerId ? User::find($volunteerId) : null, $request->user());

        return redirect()->back();
    }

    public function toggleTask(Request $request, CareNeed $careNeed, CareNeedTask $task): RedirectResponse
    {
        abort_unless($task->care_need_id === $careNeed->id, 404);
        abort_unless($careNeed->isVisibleTo($request->user()), 403);

        $this->careNeedService->toggleTaskComplete($task, $request->user());

        return redirect()->back();
    }

    public function destroyTask(Request $request, CareNeed $careNeed, CareNeedTask $task): RedirectResponse
    {
        abort_unless($task->care_need_id === $careNeed->id, 404);
        abort_unless($careNeed->isVisibleTo($request->user()), 403);

        $task->delete();

        Log::info('Care task deleted', ['task_id' => $task->id, 'user_id' => $request->user()->id]);

        return redirect()->back();
    }

    /**
     * Everything the detail view needs, shared by the full page and the split panel.
     *
     * @return array<string, mixed>
     */
    private function detail(CareNeed $careNeed, User $user): array
    {
        $careNeed->load(['member', 'assignee', 'updates.user', 'tasks.volunteer']);

        Log::info('Care need viewed', ['care_need_id' => $careNeed->id, 'user_id' => $user->id]);

        return [
            'careNeed' => new CareNeedResource($careNeed),
            'updates' => $careNeed->updates->map(fn (CareNeedUpdate $u) => [
                'id' => $u->id,
                'body' => $u->body,
                'method' => $u->contact_method->value,
                'method_label' => $u->contact_method->label(),
                'from_status' => $u->from_status?->label(),
                'to_status' => $u->to_status?->label(),
                'author' => $u->user?->name ?? 'System',
                'created_at' => $u->created_at,
            ]),
            'tasks' => $careNeed->tasks->map(fn (CareNeedTask $t) => [
                'id' => $t->id,
                'description' => $t->description,
                'due_on' => $t->due_on?->toDateString(),
                'volunteer' => $t->volunteer ? ['id' => $t->volunteer->id, 'name' => $t->volunteer->name] : null,
                'completed' => $t->isComplete(),
            ]),
            'prayerCount' => $careNeed->prayers()->count(),
            'canEscalate' => $user->isStaffOrAbove() && $careNeed->status !== CareNeedStatus::Escalated,
            'canDelete' => $user->isStaffOrAbove(),
        ];
    }

    /**
     * Detail for the need picked in the split view, or null when nothing is
     * selected or the user isn't allowed to see it.
     *
     * @return array<string, mixed>|null
     */
    private function selectedDetail(Request $request, User $user): ?array
    {
        $selectedId = $request->integer('selected');

        if (! $selectedId) {
            return null;
        }

        $careNeed = CareNeed::query()->visibleTo($user)->find($selectedId);

        return $careNeed ? $this->detail($careNeed, $user) : null;
    }

    /**
     * Dropdown options shared by the list, form, and detail pages.
     *
     * @return array<string, mixed>
     */
    private function options(): array
    {
        $toOptions = fn (array $cases) => array_map(fn ($c) => ['value' => $c->value, 'label' => $c->label()], $cases);

        return [
            'types' => $toOptions(CareNeedType::cases()),
            'priorities' => $toOptions(CareNeedPriority::cases()),
            'statuses' => $toOptions(CareNeedStatus::cases()),
            'contactMethods' => $toOptions(ContactMethod::cases()),
            'careTeam' => User::query()
                ->whereIn('role', [UserRole::Admin, UserRole::Staff, UserRole::Leader])
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }

    /**
     * @return Collection<int, array{id: int, full_name: string}>
     */
    private function memberOptions(User $user): Collection
    {
        return Member::query()
            ->visibleTo($user)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name'])
            ->map(fn (Member $m) => ['id' => $m->id, 'full_name' => $m->full_name]);
    }
}
