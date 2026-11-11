<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BenevolentRequest;
use App\Models\CourseEnrollment;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\User;
use App\Models\Visitor;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    /**
     * Display the analytics dashboard.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('admin/analytics/index', [
            'isStaffOrAbove' => $request->user()->isStaffOrAbove(),
        ]);
    }

    /**
     * Membership growth data — monthly new user registrations.
     * Staff+ only.
     */
    public function membershipGrowth(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $validated = $this->validateDateRange($request);

        $isSqlite = User::query()->getConnection()->getDriverName() === 'sqlite';
        $monthExpr = $isSqlite
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";

        $data = User::query()
            ->selectRaw("{$monthExpr} as month, count(*) as count")
            ->where('created_at', '>=', $validated['start_date'])
            ->where('created_at', '<=', $validated['end_date'])
            ->groupByRaw($monthExpr)
            ->orderByRaw($monthExpr)
            ->get();

        Log::info('Membership growth data fetched', [
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Event attendance — registrations per event for recent events.
     * Leaders allowed.
     */
    public function eventAttendance(Request $request): JsonResponse
    {
        $validated = $this->validateDateRange($request);

        $data = Event::query()
            ->withCount(['registrations' => function ($query) {
                $query->where('status', '!=', 'cancelled');
            }])
            ->where('starts_at', '>=', $validated['start_date'])
            ->where('starts_at', '<=', $validated['end_date'])
            ->orderBy('starts_at')
            ->get(['id', 'title', 'starts_at', 'max_attendees'])
            ->map(fn ($event) => [
                'title' => $event->title,
                'date' => $event->starts_at->format('M j'),
                'registrations' => $event->registrations_count,
                'capacity' => $event->max_attendees,
            ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Ministry membership distribution.
     * Leaders allowed.
     */
    public function ministryDistribution(): JsonResponse
    {
        $data = Ministry::query()
            ->withCount('users')
            ->get(['id', 'name'])
            ->filter(fn ($ministry) => $ministry->users_count > 0)
            ->sortByDesc('users_count')
            ->values()
            ->map(fn ($ministry) => [
                'name' => $ministry->name,
                'members' => $ministry->users_count,
            ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Course enrollment vs completion metrics.
     * Staff+ only.
     */
    public function courseMetrics(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $validated = $this->validateDateRange($request);

        $data = CourseEnrollment::query()
            ->join('courses', 'course_enrollments.course_id', '=', 'courses.id')
            ->selectRaw('courses.title, count(*) as enrolled, sum(case when course_enrollments.completed_at is not null then 1 else 0 end) as completed')
            ->where('course_enrollments.created_at', '>=', $validated['start_date'])
            ->where('course_enrollments.created_at', '<=', $validated['end_date'])
            ->groupBy('courses.id', 'courses.title')
            ->get();

        return response()->json(['data' => $data]);
    }

    /**
     * Visitor funnel — total visitors, followed up, converted.
     * Staff+ only.
     */
    public function visitorFunnel(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $validated = $this->validateDateRange($request);

        $total = Visitor::query()
            ->where('created_at', '>=', $validated['start_date'])
            ->where('created_at', '<=', $validated['end_date'])
            ->count();

        $followedUp = Visitor::query()
            ->where('created_at', '>=', $validated['start_date'])
            ->where('created_at', '<=', $validated['end_date'])
            ->has('followUps')
            ->count();

        $converted = Visitor::query()
            ->where('created_at', '>=', $validated['start_date'])
            ->where('created_at', '<=', $validated['end_date'])
            ->whereNotNull('converted_to_user_id')
            ->count();

        $data = [
            ['stage' => 'Total Visitors', 'count' => $total],
            ['stage' => 'Followed Up', 'count' => $followedUp],
            ['stage' => 'Converted', 'count' => $converted],
        ];

        return response()->json(['data' => $data]);
    }

    /**
     * Benevolence requests by status.
     * Staff+ only.
     */
    public function benevolenceOverview(Request $request): JsonResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $validated = $this->validateDateRange($request);

        $data = BenevolentRequest::query()
            ->selectRaw('status, count(*) as count, coalesce(sum(amount_requested), 0) as total_requested, coalesce(sum(amount_approved), 0) as total_approved')
            ->where('created_at', '>=', $validated['start_date'])
            ->where('created_at', '<=', $validated['end_date'])
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status->label(),
                'count' => $row->count,
                'total_requested' => (float) $row->total_requested,
                'total_approved' => (float) $row->total_approved,
            ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Service attendance per date (members checked in plus guests).
     * Staff+ only.
     */
    public function serviceAttendance(Request $request, AttendanceService $attendanceService): JsonResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $validated = $this->validateDateRange($request);
        $data = $attendanceService->serviceTrend($validated['start_date'], $validated['end_date']);

        Log::info('Service attendance data fetched', [
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ]);

        return response()->json(['data' => $data]);
    }

    /**
     * Validate and return start/end date range with defaults.
     *
     * @return array{start_date: string, end_date: string}
     */
    private function validateDateRange(Request $request): array
    {
        return $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]) + [
            'start_date' => now()->subMonths(6)->toDateString(),
            'end_date' => now()->toDateString(),
        ];
    }
}
