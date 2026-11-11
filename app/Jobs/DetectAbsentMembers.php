<?php

namespace App\Jobs;

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\AbsentMembersDetected;
use App\Services\AttendanceService;
use App\Services\CareNeedService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Weekly check for active members who have missed several services in a row.
 * Each one gets an "Absence follow-up" care need, and staff get one
 * notification listing everyone newly flagged.
 */
class DetectAbsentMembers implements ShouldQueue
{
    use Queueable;

    public function handle(AttendanceService $attendanceService, CareNeedService $careNeedService): void
    {
        $threshold = $attendanceService->absenceThreshold();
        $absentMembers = $attendanceService->findNewlyAbsentMembers($threshold);

        if ($absentMembers->isEmpty()) {
            Log::info('DetectAbsentMembers: no newly absent members', ['threshold' => $threshold]);

            return;
        }

        $recipients = User::query()->whereIn('role', [UserRole::Admin, UserRole::Staff])->get();

        Notification::send($recipients, new AbsentMembersDetected($absentMembers, $threshold));
        $attendanceService->markAbsenceAlerted($absentMembers);

        $openedNeeds = $absentMembers
            ->map(fn ($member) => $careNeedService->openForAbsence($member, $threshold))
            ->filter();

        Log::info('DetectAbsentMembers: flagged absent members', [
            'threshold' => $threshold,
            'member_ids' => $absentMembers->modelKeys(),
            'notified_user_ids' => $recipients->modelKeys(),
            'care_need_ids' => $openedNeeds->pluck('id')->values()->all(),
        ]);
    }
}
