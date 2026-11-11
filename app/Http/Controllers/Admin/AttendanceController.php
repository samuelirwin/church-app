<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttendanceSource;
use App\Enums\AttendanceStatus;
use App\Enums\CheckInMethod;
use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CheckInMembersRequest;
use App\Http\Requests\Admin\StoreAttendanceSessionRequest;
use App\Http\Requests\Admin\UpdateAttendanceSessionRequest;
use App\Http\Requests\Admin\UpdateAttendanceSettingsRequest;
use App\Models\AttendanceSession;
use App\Models\Event;
use App\Models\GroupMember;
use App\Models\Member;
use App\Models\MinistryGroup;
use App\Models\ServiceTime;
use App\Models\User;
use App\Services\AttendanceService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    use ReadsTableQuery;

    /**
     * Sortable columns for the sessions table.
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'occurred_on' => 'occurred_on',
        'present' => 'present_records_count',
        'guests' => 'guest_count',
        'type' => 'attendable_type',
    ];

    public function __construct(private AttendanceService $attendanceService) {}

    /**
     * Session list, a form to open a new session, and (for staff) the
     * attendance trend and members flagged as absent.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $sources = array_values(array_filter(array_map(
            fn (string $value) => AttendanceSource::tryFrom($value),
            $this->listInput($request, 'source'),
        )));
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE, 'desc');

        $sessions = AttendanceSession::query()
            ->manageableBy($user)
            ->with('attendable')
            ->withCount('presentRecords')
            ->when($sources, fn (Builder $q) => $q->whereIn('attendable_type', array_map(fn (AttendanceSource $s) => $s->modelClass(), $sources)))
            ->when($request->input('from'), fn (Builder $q, string $from) => $q->whereDate('occurred_on', '>=', $from))
            ->when($request->input('to'), fn (Builder $q, string $to) => $q->whereDate('occurred_on', '<=', $to))
            ->orderBy(self::SORTABLE[$sort ?? 'occurred_on'], $sort ? $direction : 'desc')
            ->orderByDesc('occurred_on')
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $sessions->getCollection()->transform(fn (AttendanceSession $s) => $this->sessionSummary($s));

        $isStaff = $user->isStaffOrAbove();

        return Inertia::render('admin/attendance/index', [
            'sessions' => $sessions,
            'filters' => [
                ...$request->only(['from', 'to']),
                'source' => array_map(fn (AttendanceSource $s) => $s->value, $sources),
                'sort' => $sort,
                'direction' => $sort ? $direction : null,
            ],
            'sources' => collect($isStaff ? AttendanceSource::cases() : [AttendanceSource::Group])
                ->map(fn (AttendanceSource $s) => ['value' => $s->value, 'label' => $s->label()]),
            'options' => $this->sourceOptions($user),
            'today' => now()->toDateString(),
            'trend' => $isStaff
                ? $this->attendanceService->serviceTrend(now()->subWeeks(12)->toDateString(), now()->toDateString())
                : [],
            'absentees' => $isStaff
                ? $this->attendanceService->flaggedAbsentees()->map(fn (Member $m) => [
                    'id' => $m->id,
                    'full_name' => $m->full_name,
                    'phone' => $m->phone,
                    'flagged_at' => $m->absence_alerted_at->toDateString(),
                ])
                : [],
            'absenceThreshold' => $this->attendanceService->absenceThreshold(),
            'canManageSettings' => $isStaff,
        ]);
    }

    public function store(StoreAttendanceSessionRequest $request): RedirectResponse
    {
        $session = $this->attendanceService->openSession(
            AttendanceSource::from($request->validated('source')),
            (int) $request->validated('attendable_id'),
            $request->validated('occurred_on'),
            $request->user(),
        );

        return redirect()->route('admin.attendance.show', $session);
    }

    /**
     * Roll call screen: everyone who could attend, with their current status.
     */
    public function show(Request $request, AttendanceSession $attendanceSession): Response
    {
        abort_unless($attendanceSession->canBeManagedBy($request->user()), 403);

        $attendanceSession->load('attendable');
        $records = $attendanceSession->records()->get()->keyBy('member_id');

        $roster = $this->rosterFor($attendanceSession, $records->keys())
            ->map(fn (Member $m) => [
                'id' => $m->id,
                'full_name' => $m->full_name,
                'household_id' => $m->household_id,
                'household_name' => $m->household?->name,
                'age' => $m->age,
                'status' => $records->get($m->id)?->status->value,
                'method' => $records->get($m->id)?->check_in_method->label(),
            ])
            ->values();

        $checkInUrl = route('check-in.show', $attendanceSession->check_in_token);

        return Inertia::render('admin/attendance/show', [
            'session' => [
                ...$this->sessionSummary($attendanceSession),
                'notes' => $attendanceSession->notes,
                'check_in_url' => $checkInUrl,
                'qr_url' => route('qr.generate', ['url' => $checkInUrl, 'size' => 280]),
                'self_check_in_open' => $attendanceSession->isOpenForSelfCheckIn(),
            ],
            'totals' => $this->attendanceService->totals($attendanceSession),
            'roster' => $roster,
            'canDelete' => $request->user()->isStaffOrAbove(),
        ]);
    }

    public function update(UpdateAttendanceSessionRequest $request, AttendanceSession $attendanceSession): RedirectResponse
    {
        $attendanceSession->update($request->validated());

        Log::info('Attendance session updated', [
            'session_id' => $attendanceSession->id,
            'guest_count' => $attendanceSession->guest_count,
            'user_id' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', 'Session updated.');
    }

    public function destroy(Request $request, AttendanceSession $attendanceSession): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $sessionId = $attendanceSession->id;
        $attendanceSession->delete();

        Log::info('Attendance session deleted', [
            'session_id' => $sessionId,
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('admin.attendance.index')->with('success', 'Attendance session deleted.');
    }

    public function checkIn(CheckInMembersRequest $request, AttendanceSession $attendanceSession): RedirectResponse
    {
        $this->attendanceService->checkIn(
            $attendanceSession,
            array_map('intval', $request->validated('member_ids')),
            CheckInMethod::Admin,
            $request->user(),
            AttendanceStatus::tryFrom((string) $request->validated('status')) ?? AttendanceStatus::Present,
        );

        return redirect()->back();
    }

    public function removeCheckIn(Request $request, AttendanceSession $attendanceSession, Member $member): RedirectResponse
    {
        abort_unless($attendanceSession->canBeManagedBy($request->user()), 403);

        $this->attendanceService->removeCheckIn($attendanceSession, $member, $request->user());

        return redirect()->back();
    }

    public function updateSettings(UpdateAttendanceSettingsRequest $request): RedirectResponse
    {
        $this->attendanceService->setAbsenceThreshold((int) $request->validated('absence_threshold'), $request->user());

        return redirect()->back()->with('success', 'Attendance settings saved.');
    }

    /**
     * @return array<string, mixed>
     */
    private function sessionSummary(AttendanceSession $session): array
    {
        return [
            'id' => $session->id,
            'title' => $session->title,
            'source' => $session->source->value,
            'source_label' => $session->source->label(),
            'occurred_on' => $session->occurred_on->toDateString(),
            'guest_count' => $session->guest_count,
            'present_count' => $session->present_records_count ?? $session->presentRecords()->count(),
        ];
    }

    /**
     * Who appears on the roll call. Groups list their own members; services
     * and events list every active member. Anyone already checked in is always
     * included, even if they've since gone inactive.
     *
     * @param  Collection<int, int>  $checkedInIds
     * @return Collection<int, Member>
     */
    private function rosterFor(AttendanceSession $session, Collection $checkedInIds): Collection
    {
        return Member::query()
            ->with('household:id,name')
            ->where(function (Builder $q) use ($session, $checkedInIds) {
                if ($session->source === AttendanceSource::Group) {
                    $q->whereIn('user_id', GroupMember::query()->select('user_id')->where('ministry_group_id', $session->attendable_id));
                } else {
                    $q->active();
                }

                $q->orWhereIn('id', $checkedInIds);
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
    }

    /**
     * Choices for the "open a session" form, limited to what the user may manage.
     *
     * @return array<string, Collection<int, array{id: int, name: string}>>
     */
    private function sourceOptions(User $user): array
    {
        $groups = MinistryGroup::query()
            ->active()
            ->when(! $user->isStaffOrAbove(), fn (Builder $q) => $q->where('leader_id', $user->id))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (MinistryGroup $g) => ['id' => $g->id, 'name' => $g->name]);

        if (! $user->isStaffOrAbove()) {
            return ['service' => collect(), 'event' => collect(), 'group' => $groups];
        }

        return [
            'service' => ServiceTime::query()->active()->orderBy('sort_order')->get(['id', 'name'])
                ->map(fn (ServiceTime $s) => ['id' => $s->id, 'name' => $s->name]),
            'event' => Event::query()
                ->whereBetween('starts_at', [now()->subDays(30), now()->addDays(7)])
                ->orderByDesc('starts_at')
                ->get(['id', 'title', 'starts_at'])
                ->map(fn (Event $e) => ['id' => $e->id, 'name' => "{$e->title} ({$e->starts_at->format('M j')})"]),
            'group' => $groups,
        ];
    }
}
