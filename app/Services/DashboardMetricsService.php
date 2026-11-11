<?php

namespace App\Services;

use App\Models\CareNeed;
use App\Models\Member;
use App\Models\User;
use App\Models\Visitor;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Headline numbers for the admin dashboard. Every metric compares the chosen
 * period (e.g. the last 90 days) with the period of the same length just
 * before it, and includes a bucketed trend for the sparkline.
 */
class DashboardMetricsService
{
    /**
     * Periods offered on the dashboard, in days, with their labels.
     *
     * @var array<int, string>
     */
    public const PERIODS = [
        30 => 'Last 30 days',
        90 => 'Last 3 months',
        180 => 'Last 6 months',
        365 => 'Last 12 months',
    ];

    public const DEFAULT_PERIOD = 90;

    /**
     * Above this many days, trends are grouped by month instead of by week.
     */
    private const WEEKLY_BUCKET_LIMIT = 180;

    public function __construct(private AttendanceService $attendanceService) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function metrics(User $user, int $days): array
    {
        [$start, $end, $previousStart, $previousEnd] = $this->windows($days);
        $comparison = 'vs previous '.$this->periodNoun($days);

        $attendance = $this->attendanceTotalsByDate($start, $end);
        $previousAttendance = $this->attendanceTotalsByDate($previousStart, $previousEnd);
        $visitorDates = $this->dates(Visitor::query(), 'first_visit_date', $start, $end);
        $memberDates = $this->dates(Member::query(), 'joined_at', $start, $end);
        $careNeedDates = $this->dates(CareNeed::query()->visibleTo($user), 'created_at', $start, $end);

        return [
            $this->metric(
                key: 'attendance',
                label: 'Average service attendance',
                value: $this->average($attendance),
                previous: $previousAttendance->isEmpty() ? null : $this->average($previousAttendance),
                good: 'up',
                comparison: $comparison,
                spark: $this->bucketAverages($attendance, $start, $end, $days),
                href: route('admin.attendance.index'),
            ),
            $this->metric(
                key: 'visitors',
                label: 'New visitors',
                value: $visitorDates->count(),
                previous: $this->dates(Visitor::query(), 'first_visit_date', $previousStart, $previousEnd)->count(),
                good: 'up',
                comparison: $comparison,
                spark: $this->bucketCounts($visitorDates, $start, $end, $days),
                href: route('admin.visitors.index'),
            ),
            $this->metric(
                key: 'members',
                label: 'New members',
                value: $memberDates->count(),
                previous: $this->dates(Member::query(), 'joined_at', $previousStart, $previousEnd)->count(),
                good: 'up',
                comparison: $comparison,
                spark: $this->bucketCounts($memberDates, $start, $end, $days),
                href: route('admin.members.index'),
            ),
            $this->metric(
                key: 'care_needs',
                label: 'Care needs opened',
                value: $careNeedDates->count(),
                previous: $this->dates(CareNeed::query()->visibleTo($user), 'created_at', $previousStart, $previousEnd)->count(),
                good: 'neutral',
                comparison: $comparison,
                spark: $this->bucketCounts($careNeedDates, $start, $end, $days),
                href: route('admin.care-needs.index'),
            ),
        ];
    }

    /**
     * Total service attendance (members + guests) per week or month, for the trend chart.
     * Buckets with no services recorded are null rather than 0, so the chart shows
     * a gap instead of claiming nobody came.
     *
     * @return list<array{label: string, value: int|null}>
     */
    public function attendanceTrend(int $days): array
    {
        [$start, $end] = $this->windows($days);
        $totals = array_fill_keys($this->bucketKeys($start, $end, $days), null);

        foreach ($this->attendanceTotalsByDate($start, $end) as $date => $total) {
            $key = $this->bucketKey(CarbonImmutable::parse($date), $days);
            $totals[$key] = ($totals[$key] ?? 0) + $total;
        }

        return collect($totals)->map(fn (?int $value, string $label) => ['label' => $label, 'value' => $value])->values()->all();
    }

    /**
     * Valid period from user input, falling back to the default.
     */
    public function resolvePeriod(mixed $days): int
    {
        $days = (int) $days;

        return array_key_exists($days, self::PERIODS) ? $days : self::DEFAULT_PERIOD;
    }

    /**
     * Percent change, or null when the previous value is zero/unknown (no meaningful baseline).
     */
    public function percentChange(float|int $current, float|int|null $previous): ?int
    {
        if ($previous === null || $previous == 0) {
            return null;
        }

        return (int) round(($current - $previous) / $previous * 100);
    }

    /**
     * @param  list<int|null>  $spark
     * @return array<string, mixed>
     */
    private function metric(string $key, string $label, int $value, ?int $previous, string $good, string $comparison, array $spark, string $href): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'value' => $value,
            'previous' => $previous,
            'change' => $this->percentChange($value, $previous),
            'good' => $good,
            'comparison' => $comparison,
            'spark' => $spark,
            'href' => $href,
        ];
    }

    /**
     * The current window ends today; the previous window is the same length immediately before it.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable, 2: CarbonImmutable, 3: CarbonImmutable}
     */
    private function windows(int $days): array
    {
        $end = CarbonImmutable::today();
        $start = $end->subDays($days - 1);
        $previousEnd = $start->subDay();
        $previousStart = $previousEnd->subDays($days - 1);

        return [$start, $end, $previousStart, $previousEnd];
    }

    private function periodNoun(int $days): string
    {
        return match ($days) {
            365 => '12 months',
            180 => '6 months',
            90 => '3 months',
            default => "{$days} days",
        };
    }

    /**
     * Dates of the records in the window, as Y-m-d strings (bucketed in PHP so it works on any database).
     *
     * @return Collection<int, string>
     */
    private function dates(Builder $query, string $column, CarbonImmutable $start, CarbonImmutable $end): Collection
    {
        return $query
            ->whereDate($column, '>=', $start->toDateString())
            ->whereDate($column, '<=', $end->toDateString())
            ->pluck($column)
            ->map(fn ($date) => CarbonImmutable::parse($date)->toDateString());
    }

    /**
     * @return Collection<string, int> Total attendance keyed by service date
     */
    private function attendanceTotalsByDate(CarbonImmutable $start, CarbonImmutable $end): Collection
    {
        return $this->attendanceService
            ->serviceTrend($start->toDateString(), $end->toDateString())
            ->mapWithKeys(fn (array $point) => [$point['date'] => $point['total']]);
    }

    /**
     * @param  Collection<string, int>  $values
     */
    private function average(Collection $values): int
    {
        return $values->isEmpty() ? 0 : (int) round($values->avg());
    }

    /**
     * @param  Collection<int, string>  $dates
     * @return list<int>
     */
    private function bucketCounts(Collection $dates, CarbonImmutable $start, CarbonImmutable $end, int $days): array
    {
        $counts = array_fill_keys($this->bucketKeys($start, $end, $days), 0);

        foreach ($dates as $date) {
            $counts[$this->bucketKey(CarbonImmutable::parse($date), $days)]++;
        }

        return array_values($counts);
    }

    /**
     * Average attendance per service within each bucket (null where nothing was recorded).
     *
     * @param  Collection<string, int>  $totalsByDate
     * @return list<int|null>
     */
    private function bucketAverages(Collection $totalsByDate, CarbonImmutable $start, CarbonImmutable $end, int $days): array
    {
        $buckets = array_fill_keys($this->bucketKeys($start, $end, $days), []);

        foreach ($totalsByDate as $date => $total) {
            $buckets[$this->bucketKey(CarbonImmutable::parse($date), $days)][] = $total;
        }

        return array_values(array_map(fn (array $totals) => $totals === [] ? null : (int) round(array_sum($totals) / count($totals)), $buckets));
    }

    /**
     * Ordered bucket keys covering the window: week-start dates, or Y-m months for long windows.
     *
     * @return list<string>
     */
    private function bucketKeys(CarbonImmutable $start, CarbonImmutable $end, int $days): array
    {
        $keys = [];
        $cursor = $this->bucketStart($start, $days);

        while ($cursor->lte($end)) {
            $keys[] = $this->bucketKey($cursor, $days);
            $cursor = $days > self::WEEKLY_BUCKET_LIMIT ? $cursor->addMonth() : $cursor->addWeek();
        }

        return $keys;
    }

    private function bucketKey(CarbonInterface $date, int $days): string
    {
        return $days > self::WEEKLY_BUCKET_LIMIT
            ? $date->format('Y-m')
            : $this->bucketStart(CarbonImmutable::instance($date), $days)->toDateString();
    }

    private function bucketStart(CarbonImmutable $date, int $days): CarbonImmutable
    {
        return $days > self::WEEKLY_BUCKET_LIMIT ? $date->startOfMonth() : $date->startOfWeek(CarbonInterface::SUNDAY);
    }
}
