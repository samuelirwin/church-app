<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Gender;
use App\Enums\HouseholdRole;
use App\Enums\MaritalStatus;
use App\Enums\MembershipStatus;
use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkMemberRequest;
use App\Http\Requests\Admin\BulkMemberStatusRequest;
use App\Http\Requests\Admin\ChangeMemberStatusRequest;
use App\Http\Requests\Admin\StoreMemberRequest;
use App\Http\Resources\MemberResource;
use App\Models\CareNeed;
use App\Models\CourseEnrollment;
use App\Models\EventRegistration;
use App\Models\GroupMember;
use App\Models\Household;
use App\Models\Member;
use App\Models\MinistryMember;
use App\Models\ReadingPlanEnrollment;
use App\Models\User;
use App\Models\VolunteerSchedule;
use App\Services\AttendanceService;
use App\Services\MemberService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    use ReadsTableQuery;

    /**
     * Age bands used by the directory filter, as [min age, max age].
     *
     * @var array<string, array{0: int, 1: int|null}>
     */
    private const AGE_BANDS = [
        'child' => [0, 12],
        'youth' => [13, 17],
        'adult' => [18, 64],
        'senior' => [65, null],
    ];

    public function __construct(private MemberService $memberService) {}

    /**
     * Member directory. Leaders only see people in ministries or groups they lead.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $statuses = $this->listInput($request, 'status');
        $ageBands = $this->listInput($request, 'age_band');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $members = Member::query()
            ->visibleTo($user)
            ->with('household')
            ->when($request->boolean('archived') && $user->isStaffOrAbove(), fn (Builder $q) => $q->onlyTrashed())
            ->when($request->input('search'), fn (Builder $q, string $search) => $q->search($search))
            ->when($statuses, fn (Builder $q) => $q->whereIn('membership_status', $statuses))
            ->when($request->input('household_id'), fn (Builder $q, string $id) => $q->where('household_id', $id))
            ->when($ageBands, fn (Builder $q) => $q->where(function (Builder $inner) use ($ageBands) {
                foreach ($ageBands as $band) {
                    $inner->orWhere(fn (Builder $bandQuery) => $this->applyAgeBand($bandQuery, $band));
                }
            }))
            ->tap(fn (Builder $q) => $this->applySort($q, $sort, $direction))
            ->paginate(20)
            ->withQueryString();

        $filters = [
            ...$request->only(['search', 'household_id', 'archived']),
            'status' => $statuses,
            'age_band' => $ageBands,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Member directory viewed', ['user_id' => $user->id, 'filters' => $filters]);

        return Inertia::render('admin/members/index', [
            'members' => MemberResource::collection($members),
            'filters' => $filters,
            'statuses' => $this->enumOptions(MembershipStatus::cases()),
            'ageBands' => collect(array_keys(self::AGE_BANDS))->map(fn (string $band) => [
                'value' => $band,
                'label' => ucfirst($band),
            ]),
            'canManage' => $user->isStaffOrAbove(),
        ]);
    }

    /**
     * Change the status of several members at once. Each change goes through
     * MemberService so it lands in that member's status history.
     */
    public function bulkStatus(BulkMemberStatusRequest $request): RedirectResponse
    {
        $status = MembershipStatus::from($request->validated('membership_status'));
        $members = Member::query()->visibleTo($request->user())->whereKey($request->validated('member_ids'))->get();

        foreach ($members as $member) {
            $this->memberService->changeStatus($member, $status, $request->user(), $request->validated('reason'));
        }

        Log::info('Bulk member status change', [
            'member_ids' => $members->modelKeys(),
            'status' => $status->value,
            'changed_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', "Status set to {$status->label()} for {$members->count()} ".str('member')->plural($members->count()).'.');
    }

    public function bulkArchive(BulkMemberRequest $request): RedirectResponse
    {
        $members = Member::query()->visibleTo($request->user())->whereKey($request->validated('member_ids'))->get();
        $members->each->delete();

        Log::info('Bulk member archive', [
            'member_ids' => $members->modelKeys(),
            'archived_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', "{$members->count()} ".str('member')->plural($members->count()).' archived.');
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        return Inertia::render('admin/members/create', $this->formOptions($request));
    }

    public function store(StoreMemberRequest $request): RedirectResponse
    {
        $member = $this->memberService->create(
            $request->safe()->except(['photo', 'remove_photo']),
            $request->user(),
        );

        $this->syncPhoto($request, $member);

        return redirect()->route('admin.members.show', $member)
            ->with('success', "{$member->full_name} added to the directory.");
    }

    /**
     * Member profile with household, ministries, and recent activity.
     */
    public function show(Request $request, Member $member, AttendanceService $attendanceService): Response
    {
        $user = $request->user();
        abort_unless($member->isVisibleTo($user), 403);

        $member->load(['household.members', 'user', 'statusChanges.changedBy']);

        Log::info('Member profile viewed', [
            'member_id' => $member->id,
            'viewed_by' => $user->id,
        ]);

        return Inertia::render('admin/members/show', [
            'member' => new MemberResource($member),
            'householdMembers' => MemberResource::collection(
                $member->household?->members->where('id', '!=', $member->id)->values() ?? collect()
            ),
            'activity' => $this->activityFor($member),
            'attendance' => $attendanceService->memberSummary($member),
            'careNeeds' => CareNeed::query()
                ->visibleTo($user)
                ->where('member_id', $member->id)
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn (CareNeed $need) => [
                    'id' => $need->id,
                    'title' => $need->title,
                    'type_label' => $need->type->label(),
                    'status_label' => $need->status->label(),
                    'created_at' => $need->created_at,
                ]),
            'statuses' => $this->enumOptions(MembershipStatus::cases()),
            'canManage' => $user->isStaffOrAbove(),
        ]);
    }

    public function edit(Request $request, Member $member): Response
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        return Inertia::render('admin/members/edit', [
            'member' => new MemberResource($member),
            ...$this->formOptions($request),
        ]);
    }

    /**
     * Update profile details. A status change made here is still recorded
     * in the status history, the same as using the dedicated status action.
     */
    public function update(StoreMemberRequest $request, Member $member): RedirectResponse
    {
        $data = $request->safe()->except(['photo', 'remove_photo', 'membership_status']);
        $member->update($data);

        if ($request->filled('membership_status')) {
            $this->memberService->changeStatus(
                $member,
                MembershipStatus::from($request->input('membership_status')),
                $request->user(),
                'Updated from member profile',
            );
        }

        $this->syncPhoto($request, $member);

        Log::info('Member updated', [
            'member_id' => $member->id,
            'updated_by' => $request->user()->id,
            'changed_fields' => array_keys($member->getChanges()),
        ]);

        return redirect()->route('admin.members.show', $member)
            ->with('success', "{$member->full_name} updated.");
    }

    public function changeStatus(ChangeMemberStatusRequest $request, Member $member): RedirectResponse
    {
        $this->memberService->changeStatus(
            $member,
            MembershipStatus::from($request->validated('membership_status')),
            $request->user(),
            $request->validated('reason'),
        );

        return redirect()->back()
            ->with('success', "Status updated for {$member->full_name}.");
    }

    /**
     * Archive a member (soft delete). Their history stays intact and they
     * can be restored later.
     */
    public function destroy(Request $request, Member $member): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $member->delete();

        Log::info('Member archived', [
            'member_id' => $member->id,
            'archived_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.members.index')
            ->with('success', "{$member->full_name} archived.");
    }

    public function restore(Request $request, int $memberId): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $member = Member::onlyTrashed()->findOrFail($memberId);
        $member->restore();

        Log::info('Member restored', [
            'member_id' => $member->id,
            'restored_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.members.show', $member)
            ->with('success', "{$member->full_name} restored.");
    }

    /**
     * Create a login account for a member and email them a link to set a password.
     */
    public function invite(Request $request, Member $member): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        if ($member->hasAccount()) {
            return redirect()->back()->with('info', "{$member->full_name} already has an account.");
        }

        if (! $member->email) {
            return redirect()->back()->with('error', 'Add an email address before sending an invite.');
        }

        if (User::query()->where('email', $member->email)->exists()) {
            return redirect()->back()->with('error', 'An account with this email already exists.');
        }

        $this->memberService->inviteToAccount($member, $request->user());

        return redirect()->back()
            ->with('success', "Invite sent to {$member->email}.");
    }

    /**
     * Shared dropdown options for the create and edit forms.
     *
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            'households' => Household::query()->orderBy('name')->get(['id', 'name']),
            'statuses' => $this->enumOptions(MembershipStatus::cases()),
            'genders' => $this->enumOptions(Gender::cases()),
            'maritalStatuses' => $this->enumOptions(MaritalStatus::cases()),
            'householdRoles' => $this->enumOptions(HouseholdRole::cases()),
            'preselectedHouseholdId' => $request->integer('household_id') ?: null,
        ];
    }

    /**
     * Turn enum cases into the {value, label} pairs the select inputs expect.
     *
     * @param  array<int, MembershipStatus|Gender|MaritalStatus|HouseholdRole>  $cases
     * @return array<int, array{value: string, label: string}>
     */
    private function enumOptions(array $cases): array
    {
        return array_map(fn ($case) => ['value' => $case->value, 'label' => $case->label()], $cases);
    }

    /**
     * Columns the directory can be sorted by, mapped to what they sort on.
     * Anything else in the URL is ignored.
     *
     * @var array<string, list<string>>
     */
    private const SORTABLE = [
        'name' => ['last_name', 'first_name'],
        'status' => ['membership_status'],
        'joined_at' => ['joined_at'],
        'age' => ['date_of_birth'],
        'household' => ['household_id'],
    ];

    /**
     * Apply the chosen sort. Age is flipped because an older birth date means an older person.
     * Without a sort, the directory is alphabetical.
     */
    private function applySort(Builder $query, ?string $sort, string $direction): void
    {
        $columns = self::SORTABLE[$sort ?? 'name'];
        $direction = $sort === 'age' ? ($direction === 'asc' ? 'desc' : 'asc') : $direction;

        foreach ($columns as $column) {
            $query->orderBy($column, $sort ? $direction : 'asc');
        }

        $query->orderBy('id');
    }

    /**
     * Filter by age band using date of birth ranges, so it works on any database.
     */
    private function applyAgeBand(Builder $query, string $band): Builder
    {
        if (! isset(self::AGE_BANDS[$band])) {
            return $query;
        }

        [$minAge, $maxAge] = self::AGE_BANDS[$band];

        $query->whereDate('date_of_birth', '<=', now()->subYears($minAge)->toDateString());

        if ($maxAge !== null) {
            $query->whereDate('date_of_birth', '>', now()->subYears($maxAge + 1)->toDateString());
        }

        return $query;
    }

    private function syncPhoto(StoreMemberRequest $request, Member $member): void
    {
        if ($request->hasFile('photo')) {
            $member->addMediaFromRequest('photo')->toMediaCollection('photo');
            Log::info('Member photo updated', ['member_id' => $member->id]);
        } elseif ($request->boolean('remove_photo')) {
            $member->clearMediaCollection('photo');
            Log::info('Member photo removed', ['member_id' => $member->id]);
        }
    }

    /**
     * Summarise what the member is involved in. Most of the app tracks
     * involvement against user accounts, so members without one have no activity.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    private function activityFor(Member $member): array
    {
        if (! $member->user_id) {
            return ['ministries' => [], 'groups' => [], 'events' => [], 'courses' => [], 'readingPlans' => [], 'duties' => []];
        }

        $userId = $member->user_id;

        return [
            'ministries' => MinistryMember::query()->where('user_id', $userId)->with('ministry:id,name')->get()
                ->map(fn ($m) => ['id' => $m->ministry_id, 'name' => $m->ministry?->name, 'role' => $m->role?->label()])->all(),
            'groups' => GroupMember::query()->where('user_id', $userId)->with('group:id,name')->get()
                ->map(fn ($g) => ['id' => $g->ministry_group_id, 'name' => $g->group?->name])->all(),
            'events' => EventRegistration::query()->where('user_id', $userId)->with('event:id,title,starts_at')->latest('registered_at')->limit(10)->get()
                ->map(fn ($r) => ['id' => $r->event_id, 'title' => $r->event?->title, 'starts_at' => $r->event?->starts_at, 'status' => $r->status?->value])->all(),
            'courses' => CourseEnrollment::query()->where('user_id', $userId)->with('course:id,title')->latest('enrolled_at')->limit(10)->get()
                ->map(fn ($c) => ['id' => $c->course_id, 'title' => $c->course?->title, 'progress' => $c->progress_percentage, 'completed' => $c->completed_at !== null])->all(),
            'readingPlans' => ReadingPlanEnrollment::query()->where('user_id', $userId)->with('readingPlan:id,title')->latest('started_at')->limit(10)->get()
                ->map(fn ($p) => ['id' => $p->reading_plan_id, 'title' => $p->readingPlan?->title, 'completed' => $p->completed_at !== null])->all(),
            'duties' => VolunteerSchedule::query()->where('user_id', $userId)->with('role:id,name')->latest('scheduled_date')->limit(10)->get()
                ->map(fn ($d) => ['id' => $d->id, 'role' => $d->role?->name, 'date' => $d->scheduled_date?->toDateString(), 'status' => $d->status?->value])->all(),
        ];
    }
}
