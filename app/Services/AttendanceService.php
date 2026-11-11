<?php

namespace App\Services;

use App\Enums\AttendanceSource;
use App\Enums\AttendanceStatus;
use App\Enums\CheckInMethod;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\Member;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Everything to do with recording and reporting attendance. Controllers,
 * the self check-in page, and the weekly absence job all go through here.
 */
class AttendanceService
{
    public const DEFAULT_ABSENCE_THRESHOLD = 3;

    /**
     * Find or create the session for a source on a date. Opening the same
     * service twice on one day returns the existing session.
     */
    public function openSession(AttendanceSource $source, int $attendableId, string $date, ?User $openedBy = null): AttendanceSession
    {
        $session = AttendanceSession::query()
            ->forSource($source)
            ->where('attendable_id', $attendableId)
            ->whereDate('occurred_on', $date)
            ->first()
            ?? AttendanceSession::create([
                'attendable_type' => $source->modelClass(),
                'attendable_id' => $attendableId,
                'occurred_on' => $date,
                'created_by' => $openedBy?->id,
            ]);

        Log::info($session->wasRecentlyCreated ? 'Attendance session created' : 'Attendance session reopened', [
            'session_id' => $session->id,
            'source' => $source->value,
            'attendable_id' => $attendableId,
            'occurred_on' => $date,
            'user_id' => $openedBy?->id,
        ]);

        return $session;
    }

    /**
     * Mark members as present (or excused). Checking someone in twice is safe:
     * the original check-in time is kept and only the status is updated.
     *
     * @param  array<int, int>  $memberIds
     * @return int Number of members whose record was created or changed
     */
    public function checkIn(
        AttendanceSession $session,
        array $memberIds,
        CheckInMethod $method,
        ?User $checkedInBy = null,
        AttendanceStatus $status = AttendanceStatus::Present,
    ): int {
        $changed = 0;

        foreach (array_unique($memberIds) as $memberId) {
            $record = AttendanceRecord::firstOrNew([
                'attendance_session_id' => $session->id,
                'member_id' => $memberId,
            ]);

            if ($record->exists && $record->status === $status) {
                continue;
            }

            $record->fill([
                'status' => $status,
                'check_in_method' => $record->exists ? $record->check_in_method : $method,
                'checked_in_at' => $record->checked_in_at ?? now(),
                'checked_in_by' => $record->checked_in_by ?? $checkedInBy?->id,
            ])->save();

            $changed++;
        }

        Log::info('Attendance check-in recorded', [
            'session_id' => $session->id,
            'member_ids' => array_values(array_unique($memberIds)),
            'changed' => $changed,
            'status' => $status->value,
            'method' => $method->value,
            'user_id' => $checkedInBy?->id,
        ]);

        return $changed;
    }

    public function removeCheckIn(AttendanceSession $session, Member $member, ?User $removedBy = null): void
    {
        $deleted = $session->records()->where('member_id', $member->id)->delete();

        Log::info('Attendance check-in removed', [
            'session_id' => $session->id,
            'member_id' => $member->id,
            'deleted' => $deleted,
            'user_id' => $removedBy?->id,
        ]);
    }

    /**
     * @return array{present: int, excused: int, guests: int, total: int}
     */
    public function totals(AttendanceSession $session): array
    {
        $counts = $session->records()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $present = (int) ($counts[AttendanceStatus::Present->value] ?? 0);

        return [
            'present' => $present,
            'excused' => (int) ($counts[AttendanceStatus::Excused->value] ?? 0),
            'guests' => $session->guest_count,
            'total' => $present + $session->guest_count,
        ];
    }

    /**
     * Attendance summary for one member across recent services.
     *
     * @return array{services_held: int, services_attended: int, rate: int|null, recent: array<int, array<string, mixed>>}
     */
    public function memberSummary(Member $member, int $weeks = 12): array
    {
        $since = now()->subWeeks($weeks)->toDateString();

        $serviceDates = AttendanceSession::query()
            ->forSource(AttendanceSource::Service)
            ->whereDate('occurred_on', '>=', $since)
            ->whereDate('occurred_on', '<=', now()->toDateString())
            ->pluck('occurred_on')
            ->map(fn ($date) => $date->toDateString())
            ->unique();

        $attendedDates = $member->attendanceRecords()
            ->where('status', AttendanceStatus::Present)
            ->whereHas('session', fn (Builder $q) => $q->forSource(AttendanceSource::Service)->whereDate('occurred_on', '>=', $since))
            ->with('session:id,occurred_on')
            ->get()
            ->map(fn (AttendanceRecord $r) => $r->session->occurred_on->toDateString())
            ->unique();

        $recent = $member->attendanceRecords()
            ->with('session.attendable')
            ->latest('checked_in_at')
            ->limit(15)
            ->get()
            ->map(fn (AttendanceRecord $r) => [
                'id' => $r->id,
                'session_id' => $r->attendance_session_id,
                'title' => $r->session->title,
                'source' => $r->session->source->label(),
                'occurred_on' => $r->session->occurred_on->toDateString(),
                'status' => $r->status->label(),
                'method' => $r->check_in_method->label(),
            ])
            ->all();

        $held = $serviceDates->count();

        return [
            'services_held' => $held,
            'services_attended' => $attendedDates->count(),
            'rate' => $held > 0 ? (int) round($attendedDates->count() / $held * 100) : null,
            'recent' => $recent,
        ];
    }

    /**
     * Total service attendance per date (members present plus guests).
     *
     * @return Collection<int, array{date: string, members: int, guests: int, total: int}>
     */
    public function serviceTrend(string $startDate, string $endDate): Collection
    {
        return AttendanceSession::query()
            ->forSource(AttendanceSource::Service)
            ->whereDate('occurred_on', '>=', $startDate)
            ->whereDate('occurred_on', '<=', $endDate)
            ->withCount('presentRecords')
            ->orderBy('occurred_on')
            ->get()
            ->groupBy(fn (AttendanceSession $s) => $s->occurred_on->toDateString())
            ->map(fn (Collection $sessions, string $date) => [
                'date' => $date,
                'members' => (int) $sessions->sum('present_records_count'),
                'guests' => (int) $sessions->sum('guest_count'),
                'total' => (int) ($sessions->sum('present_records_count') + $sessions->sum('guest_count')),
            ])
            ->values();
    }

    public function absenceThreshold(): int
    {
        $value = (int) SiteSetting::getValue('attendance', 'absence_threshold', (string) self::DEFAULT_ABSENCE_THRESHOLD);

        return max(1, $value);
    }

    public function setAbsenceThreshold(int $weeks, User $changedBy): void
    {
        SiteSetting::setValue('attendance', 'absence_threshold', (string) $weeks);

        Log::info('Absence threshold updated', ['weeks' => $weeks, 'user_id' => $changedBy->id]);
    }

    /**
     * Active members who missed the last N service dates in a row.
     *
     * Only people who have attended at least once are considered, so turning
     * on attendance tracking doesn't flag the whole directory. Someone already
     * flagged is skipped until they attend again, so each absence streak only
     * raises one alert.
     *
     * @return Collection<int, Member>
     */
    public function findNewlyAbsentMembers(?int $threshold = null): Collection
    {
        $threshold ??= $this->absenceThreshold();

        // Several services can share a date (e.g. 9am and 11am), so we look at
        // the last N distinct dates and every service session on those dates.
        $sessions = AttendanceSession::query()
            ->forSource(AttendanceSource::Service)
            ->whereDate('occurred_on', '<=', now()->toDateString())
            ->orderByDesc('occurred_on')
            ->limit($threshold * 10)
            ->get(['id', 'occurred_on']);

        $recentDates = $sessions->map(fn (AttendanceSession $s) => $s->occurred_on->toDateString())
            ->unique()
            ->take($threshold);

        if ($recentDates->count() < $threshold) {
            return collect();
        }

        $recentSessionIds = $sessions
            ->filter(fn (AttendanceSession $s) => $recentDates->contains($s->occurred_on->toDateString()))
            ->pluck('id');

        return Member::query()
            ->active()
            ->whereHas('attendanceRecords', fn (Builder $q) => $q->where('status', AttendanceStatus::Present))
            ->whereDoesntHave('attendanceRecords', fn (Builder $q) => $q->whereIn('attendance_session_id', $recentSessionIds))
            ->withMax('attendanceRecords', 'created_at')
            ->get()
            ->filter(fn (Member $m) => $m->absence_alerted_at === null
                || $m->absence_alerted_at->lt($m->attendance_records_max_created_at))
            ->values();
    }

    /**
     * Members who were flagged as absent and haven't attended since.
     *
     * @return Collection<int, Member>
     */
    public function flaggedAbsentees(): Collection
    {
        return Member::query()
            ->active()
            ->whereNotNull('absence_alerted_at')
            ->withMax('attendanceRecords', 'created_at')
            ->orderByDesc('absence_alerted_at')
            ->get()
            ->filter(fn (Member $m) => $m->attendance_records_max_created_at === null
                || $m->absence_alerted_at->gte($m->attendance_records_max_created_at))
            ->values();
    }

    /**
     * @param  Collection<int, Member>  $members
     */
    public function markAbsenceAlerted(Collection $members): void
    {
        Member::query()->whereKey($members->modelKeys())->update(['absence_alerted_at' => now()]);
    }
}
