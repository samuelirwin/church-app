<?php

namespace App\Http\Controllers\Member;

use App\Enums\CheckInMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Member\SelfCheckInRequest;
use App\Models\AttendanceSession;
use App\Models\Member;
use App\Services\AttendanceService;
use App\Services\MemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Self check-in reached by scanning a session's QR code. The token in the URL
 * identifies the session, so the link can't be guessed from a session id.
 */
class CheckInController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService,
        private MemberService $memberService,
    ) {}

    public function show(Request $request, string $token): Response
    {
        $session = $this->findSession($token);
        $member = $this->memberService->syncFromUser($request->user());
        $checkedIn = $session->records()->pluck('member_id');

        $people = $member->household_id
            ? Member::query()->where('household_id', $member->household_id)->orderBy('date_of_birth')->get()
            : collect([$member]);

        Log::info('Self check-in page viewed', [
            'session_id' => $session->id,
            'member_id' => $member->id,
        ]);

        return Inertia::render('member/check-in', [
            'session' => [
                'token' => $session->check_in_token,
                'title' => $session->title,
                'source_label' => $session->source->label(),
                'occurred_on' => $session->occurred_on->toDateString(),
                'is_open' => $session->isOpenForSelfCheckIn(),
            ],
            'people' => $people->map(fn (Member $m) => [
                'id' => $m->id,
                'full_name' => $m->full_name,
                'is_self' => $m->id === $member->id,
                'checked_in' => $checkedIn->contains($m->id),
            ])->values(),
        ]);
    }

    public function store(SelfCheckInRequest $request, string $token): RedirectResponse
    {
        $session = $this->findSession($token);

        if (! $session->isOpenForSelfCheckIn()) {
            return redirect()->back()->with('error', 'Check-in for this session is closed.');
        }

        $count = $this->attendanceService->checkIn(
            $session,
            array_map('intval', $request->validated('member_ids')),
            CheckInMethod::SelfQr,
            $request->user(),
        );

        return redirect()->back()->with('success', $count > 0 ? 'You are checked in. Welcome!' : 'You were already checked in.');
    }

    private function findSession(string $token): AttendanceSession
    {
        return AttendanceSession::query()->with('attendable')->where('check_in_token', $token)->firstOrFail();
    }
}
