<?php

use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\CareNeed;
use App\Models\Member;
use App\Models\User;
use App\Models\Visitor;
use App\Services\DashboardMetricsService;

/**
 * @return array<string, mixed>
 */
function metricFor(string $key, int $days = 30, ?User $user = null): array
{
    $metrics = app(DashboardMetricsService::class)->metrics($user ?? User::factory()->admin()->create(), $days);

    return collect($metrics)->firstWhere('key', $key);
}

it('calculates percent change and has no baseline when the previous value is zero', function (int $current, ?int $previous, ?int $expected) {
    expect(app(DashboardMetricsService::class)->percentChange($current, $previous))->toBe($expected);
})->with([
    'growth' => [15, 10, 50],
    'decline' => [5, 10, -50],
    'rounded' => [2, 3, -33],
    'flat' => [7, 7, 0],
    'no baseline' => [4, 0, null],
    'unknown baseline' => [4, null, null],
]);

it('only accepts the offered periods', function (mixed $input, int $expected) {
    expect(app(DashboardMetricsService::class)->resolvePeriod($input))->toBe($expected);
})->with([
    'valid' => ['30', 30],
    'year' => [365, 365],
    'unknown' => ['45', 90],
    'missing' => [null, 90],
]);

it('compares new visitors with the period before', function () {
    Visitor::factory()->count(3)->create(['first_visit_date' => now()->subDays(5)->toDateString()]);
    Visitor::factory()->create(['first_visit_date' => now()->subDays(29)->toDateString()]);
    Visitor::factory()->count(2)->create(['first_visit_date' => now()->subDays(30)->toDateString()]);
    Visitor::factory()->create(['first_visit_date' => now()->subDays(59)->toDateString()]);
    Visitor::factory()->create(['first_visit_date' => now()->subDays(60)->toDateString()]);

    $metric = metricFor('visitors');

    expect($metric['value'])->toBe(4)
        ->and($metric['previous'])->toBe(3)
        ->and($metric['change'])->toBe(33)
        ->and($metric['good'])->toBe('up')
        ->and($metric['comparison'])->toBe('vs previous 30 days')
        ->and(array_sum($metric['spark']))->toBe(4);
});

it('counts new members by join date, including people without accounts', function () {
    Member::factory()->count(2)->create(['joined_at' => now()->subDays(3)->toDateString()]);
    Member::factory()->create(['joined_at' => now()->subYears(2)->toDateString()]);

    expect(metricFor('members')['value'])->toBe(2);
});

it('averages service attendance per service date', function () {
    $first = AttendanceSession::factory()->on(now()->subDays(7)->toDateString())->create(['guest_count' => 4]);
    AttendanceRecord::factory()->count(6)->create(['attendance_session_id' => $first->id]);
    $second = AttendanceSession::factory()->on(now()->subDays(14)->toDateString())->create(['guest_count' => 0]);
    AttendanceRecord::factory()->count(4)->create(['attendance_session_id' => $second->id]);

    $metric = metricFor('attendance');

    expect($metric['value'])->toBe(7)
        ->and($metric['previous'])->toBeNull()
        ->and($metric['change'])->toBeNull();
});

it('does not count confidential care needs the user cannot see', function () {
    $staff = User::factory()->staff()->create();
    CareNeed::factory()->create();
    CareNeed::factory()->confidential()->create();

    expect(metricFor('care_needs', 30, $staff)['value'])->toBe(1)
        ->and(metricFor('care_needs', 30, User::factory()->admin()->create())['value'])->toBe(2);
});

it('buckets the attendance trend by week, or by month for a year', function () {
    $session = AttendanceSession::factory()->on(now()->subDays(2)->toDateString())->create(['guest_count' => 3]);
    AttendanceRecord::factory()->count(5)->create(['attendance_session_id' => $session->id]);

    $service = app(DashboardMetricsService::class);
    $weekly = $service->attendanceTrend(90);
    $monthly = $service->attendanceTrend(365);

    expect(count($weekly))->toBeGreaterThanOrEqual(13)->toBeLessThanOrEqual(15)
        ->and(collect($weekly)->sum('value'))->toBe(8)
        ->and(collect($weekly)->whereNull('value')->count())->toBe(count($weekly) - 1)
        ->and(count($monthly))->toBeGreaterThanOrEqual(12)->toBeLessThanOrEqual(13)
        ->and($monthly[0]['label'])->toMatch('/^\d{4}-\d{2}$/');
});

it('serves metrics and the trend on the admin dashboard', function () {
    $this->actingAs(User::factory()->staff()->create())
        ->get(route('admin.dashboard', ['period' => 30]))
        ->assertInertia(fn ($page) => $page
            ->where('period', 30)
            ->has('periods', 4)
            ->has('metrics', 4)
            ->where('metrics.0.key', 'attendance')
            ->has('attendanceTrend')
            ->has('stats')
            ->reloadOnly(['metrics', 'attendanceTrend', 'period'], fn ($reload) => $reload->has('metrics')->missing('stats'))
        );
});

it('reports membership growth from member join dates', function () {
    Member::factory()->count(2)->create(['joined_at' => now()->startOfMonth()->toDateString()]);
    User::factory()->count(3)->create();

    $this->actingAs(User::factory()->staff()->create())
        ->getJson(route('admin.analytics.membership-growth'))
        ->assertOk()
        ->assertJsonPath('data.0.month', now()->format('Y-m'))
        ->assertJsonPath('data.0.count', 2);
});
