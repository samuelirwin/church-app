<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookLending;
use App\Models\CareNeed;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Event;
use App\Models\Form;
use App\Models\FormResponse;
use App\Models\Member;
use App\Models\Ministry;
use App\Models\MinistryGroup;
use App\Models\Post;
use App\Models\ReadingPlan;
use App\Models\Sermon;
use App\Models\User;
use App\Models\Visitor;
use App\Models\VolunteerSchedule;
use App\Services\DashboardMetricsService;
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
    public function __construct(private DashboardMetricsService $metricsService) {}

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
            'stats' => fn () => $this->statsFor($user),
        ]);
    }

    /**
     * Headline counts across the app. Care need counts respect the
     * viewer's visibility so confidential needs aren't leaked as numbers.
     *
     * @return array<string, int>
     */
    private function statsFor(User $user): array
    {
        return [
            'myCareNeeds' => CareNeed::query()->visibleTo($user)->active()->where('assigned_to', $user->id)->count(),
            'overdueCareNeeds' => CareNeed::query()->visibleTo($user)->overdue()->count(),
            'activeMembers' => Member::query()->active()->count(),
            'totalUsers' => User::count(),
            'totalSermons' => Sermon::count(),
            'totalCourses' => Course::count(),
            'totalReadingPlans' => ReadingPlan::count(),
            'totalBooks' => Book::count(),
            'totalPosts' => Post::count(),
            'totalForms' => Form::count(),
            'totalFormResponses' => FormResponse::count(),
            'activeLendings' => BookLending::active()->count(),
            'overdueLendings' => BookLending::overdue()->count(),
            'totalEnrollments' => CourseEnrollment::count(),
            'totalEvents' => Event::count(),
            'totalMinistries' => Ministry::count(),
            'totalGroups' => MinistryGroup::count(),
            'upcomingSchedules' => VolunteerSchedule::upcoming()->count(),
            'newVisitors' => Visitor::where('follow_up_status', 'new')->count(),
            'totalVisitors' => Visitor::count(),
        ];
    }
}
