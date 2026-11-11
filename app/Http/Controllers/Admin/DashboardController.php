<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardMetricsService;
use App\Services\DashboardOverviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Home page of the admin area. Personal widgets live on the member
 * dashboard; this page is only the church-wide overview.
 */
class DashboardController extends Controller
{
    public function __construct(
        private DashboardMetricsService $metricsService,
        private DashboardOverviewService $overviewService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $period = $this->metricsService->resolvePeriod($request->query('period'));

        Log::info('Admin dashboard viewed', [
            'user_id' => $user->id,
            'role' => $user->role->value,
            'period_days' => $period,
        ]);

        return Inertia::render('admin/dashboard', [
            'period' => $period,
            'periods' => collect(DashboardMetricsService::PERIODS)
                ->map(fn (string $label, int $days) => ['value' => $days, 'label' => $label])
                ->values(),
            'metrics' => fn () => $this->metricsService->metrics($user, $period),
            'attendanceTrend' => fn () => $this->metricsService->attendanceTrend($period),
            'attention' => fn () => $this->overviewService->attention($user),
            'membership' => fn () => $this->overviewService->membership(),
            'visitorPipeline' => fn () => $this->overviewService->visitorPipeline(),
            'upcomingDuties' => fn () => $this->overviewService->upcomingDuties(),
            'upcomingEvents' => fn () => $this->overviewService->upcomingEvents(),
            'ministries' => fn () => $this->overviewService->ministries(),
            'contentLibrary' => fn () => $this->overviewService->contentLibrary(),
            'engagement' => fn () => $this->overviewService->engagement(),
        ]);
    }
}
