<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVolunteerScheduleRequest;
use App\Models\ServiceTime;
use App\Models\User;
use App\Models\VolunteerRole;
use App\Models\VolunteerSchedule;
use App\Notifications\VolunteerAssignedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class VolunteerScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $weekStart = $request->input('week')
            ? Carbon::parse($request->input('week'))->startOfWeek()
            : now()->startOfWeek();

        $schedules = VolunteerSchedule::query()
            ->with(['role', 'user', 'scheduler', 'serviceTime'])
            ->forWeek($weekStart)
            ->when($request->input('role_id'), function ($query, $roleId) {
                $query->where('volunteer_role_id', $roleId);
            })
            ->when($request->input('user_id'), function ($query, $userId) {
                $query->where('user_id', $userId);
            })
            ->orderBy('scheduled_date')
            ->orderBy('service_time_id')
            ->get();

        $roles = VolunteerRole::active()->orderBy('name')->get(['id', 'name']);
        $users = User::orderBy('name')->get(['id', 'name']);
        $serviceTimes = ServiceTime::active()->orderBy('sort_order')->get(['id', 'name']);

        $nextSunday = now()->isSunday() ? now() : now()->next(Carbon::SUNDAY);

        $nextSundaySchedules = VolunteerSchedule::query()
            ->with(['role', 'user', 'serviceTime'])
            ->forNextSunday()
            ->orderBy('volunteer_role_id')
            ->orderBy('service_time_id')
            ->get();

        Log::info('Volunteer roster viewed', [
            'week_start' => $weekStart->toDateString(),
            'next_sunday' => $nextSunday->toDateString(),
            'next_sunday_schedule_count' => $nextSundaySchedules->count(),
            'viewed_by' => $request->user()->id,
        ]);

        return Inertia::render('admin/volunteer/roster', [
            'schedules' => $schedules,
            'roles' => $roles,
            'users' => $users,
            'serviceTimes' => $serviceTimes,
            'weekStart' => $weekStart->toDateString(),
            'filters' => $request->only(['role_id', 'user_id']),
            'nextSundaySchedules' => $nextSundaySchedules,
            'nextSundayDate' => $nextSunday->toDateString(),
        ]);
    }

    public function store(StoreVolunteerScheduleRequest $request): RedirectResponse
    {
        $schedule = VolunteerSchedule::create([
            ...$request->validated(),
            'scheduled_by' => $request->user()->id,
        ]);

        $schedule->load(['role', 'serviceTime']);

        if ($schedule->user_id) {
            $volunteer = User::find($schedule->user_id);
            $volunteer?->notify(new VolunteerAssignedNotification($schedule));
        }

        Log::info('Volunteer schedule created', [
            'schedule_id' => $schedule->id,
            'role_id' => $schedule->volunteer_role_id,
            'user_id' => $schedule->user_id,
            'date' => $schedule->scheduled_date->toDateString(),
            'scheduled_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Volunteer schedule created.');
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $request->validate([
            'assignments' => ['required', 'array', 'min:1'],
            'assignments.*.volunteer_role_id' => ['required', 'exists:volunteer_roles,id'],
            'assignments.*.user_id' => ['required', 'exists:users,id'],
            'assignments.*.scheduled_date' => ['required', 'date'],
            'assignments.*.service_time_id' => ['required', 'exists:service_times,id'],
            'assignments.*.notes' => ['nullable', 'string'],
        ]);

        $count = 0;

        foreach ($request->input('assignments') as $assignment) {
            $existing = VolunteerSchedule::where('volunteer_role_id', $assignment['volunteer_role_id'])
                ->where('user_id', $assignment['user_id'])
                ->whereDate('scheduled_date', $assignment['scheduled_date'])
                ->where('service_time_id', $assignment['service_time_id'])
                ->exists();

            if (! $existing) {
                $schedule = VolunteerSchedule::create([
                    ...$assignment,
                    'scheduled_by' => $request->user()->id,
                ]);

                $schedule->load(['role', 'serviceTime']);

                if ($schedule->user_id) {
                    $volunteer = User::find($schedule->user_id);
                    $volunteer?->notify(new VolunteerAssignedNotification($schedule));
                }

                $count++;
            }
        }

        Log::info('Bulk volunteer schedules created', [
            'count' => $count,
            'scheduled_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', "{$count} volunteer schedule(s) created.");
    }

    public function update(Request $request, VolunteerSchedule $volunteerSchedule): RedirectResponse
    {
        $request->validate([
            'status' => ['nullable', 'in:scheduled,confirmed,declined,absent'],
            'notes' => ['nullable', 'string'],
        ]);

        $volunteerSchedule->update($request->only(['status', 'notes']));

        Log::info('Volunteer schedule updated', [
            'schedule_id' => $volunteerSchedule->id,
            'status' => $volunteerSchedule->status->value,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Volunteer schedule updated.');
    }

    public function destroy(VolunteerSchedule $volunteerSchedule): RedirectResponse
    {
        $scheduleId = $volunteerSchedule->id;

        $volunteerSchedule->delete();

        Log::info('Volunteer schedule deleted', [
            'schedule_id' => $scheduleId,
        ]);

        return redirect()->back()
            ->with('success', 'Volunteer schedule removed.');
    }
}
