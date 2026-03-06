<?php

namespace App\Http\Controllers\Member;

use App\Enums\ScheduleStatus;
use App\Http\Controllers\Controller;
use App\Models\VolunteerSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class VolunteerController extends Controller
{
    public function myDuties(Request $request): Response
    {
        $duties = VolunteerSchedule::query()
            ->with(['role', 'scheduler', 'serviceTime'])
            ->forUser($request->user()->id)
            ->upcoming()
            ->orderBy('scheduled_date')
            ->orderBy('service_time_id')
            ->paginate(20);

        $nextSunday = now()->isSunday() ? now() : now()->next(Carbon::SUNDAY);

        Log::info('Volunteer duties viewed', [
            'user_id' => $request->user()->id,
            'duty_count' => $duties->total(),
            'next_sunday' => $nextSunday->toDateString(),
        ]);

        return Inertia::render('member/volunteer/my-duties', [
            'duties' => $duties,
            'nextSundayDate' => $nextSunday->toDateString(),
        ]);
    }

    public function confirm(Request $request, VolunteerSchedule $volunteerSchedule): RedirectResponse
    {
        if ($volunteerSchedule->user_id !== $request->user()->id) {
            abort(403);
        }

        $volunteerSchedule->update(['status' => ScheduleStatus::Confirmed]);

        Log::info('Volunteer confirmed duty', [
            'schedule_id' => $volunteerSchedule->id,
            'user_id' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Duty confirmed.');
    }

    public function decline(Request $request, VolunteerSchedule $volunteerSchedule): RedirectResponse
    {
        if ($volunteerSchedule->user_id !== $request->user()->id) {
            abort(403);
        }

        $volunteerSchedule->update(['status' => ScheduleStatus::Declined]);

        Log::info('Volunteer declined duty', [
            'schedule_id' => $volunteerSchedule->id,
            'user_id' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Duty declined.');
    }
}
