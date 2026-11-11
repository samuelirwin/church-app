<?php

namespace App\Http\Controllers;

use App\Models\BookLending;
use App\Models\CourseEnrollment;
use App\Models\EventRegistration;
use App\Models\MinistryMember;
use App\Models\ReadingPlanEnrollment;
use App\Models\Sermon;
use App\Models\User;
use App\Models\VolunteerSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the member dashboard with personalized widgets.
     * Church-wide stats live on the admin dashboard instead.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        Log::info('Dashboard viewed', [
            'user_id' => $user->id,
            'role' => $user->role->value,
        ]);

        return Inertia::render('dashboard', [
            'memberData' => $this->getMemberData($user),
        ]);
    }

    /**
     * Gather member-facing dashboard data for the authenticated user.
     *
     * @return array<string, mixed>
     */
    private function getMemberData(User $user): array
    {
        $courseEnrollments = CourseEnrollment::with('course:id,title,slug')
            ->where('user_id', $user->id)
            ->whereNull('completed_at')
            ->latest('enrolled_at')
            ->limit(5)
            ->get()
            ->map(fn (CourseEnrollment $e) => [
                'id' => $e->id,
                'course_title' => $e->course->title,
                'course_slug' => $e->course->slug,
                'progress' => $e->progress_percentage,
            ]);

        $readingPlanEnrollments = ReadingPlanEnrollment::with(['readingPlan:id,title,slug,duration_days'])
            ->withCount('progress')
            ->where('user_id', $user->id)
            ->whereNull('completed_at')
            ->latest('started_at')
            ->limit(5)
            ->get()
            ->map(fn (ReadingPlanEnrollment $e) => [
                'id' => $e->id,
                'plan_title' => $e->readingPlan->title,
                'plan_slug' => $e->readingPlan->slug,
                'days_completed' => $e->progress_count,
                'total_days' => $e->readingPlan->duration_days,
            ]);

        $bookLendings = BookLending::with('book:id,title,slug')
            ->where('user_id', $user->id)
            ->active()
            ->latest('borrowed_at')
            ->limit(5)
            ->get()
            ->map(fn (BookLending $l) => [
                'id' => $l->id,
                'book_title' => $l->book->title,
                'book_slug' => $l->book->slug,
                'due_at' => $l->due_at->toDateString(),
                'is_overdue' => $l->isOverdue(),
            ]);

        $recentSermons = Sermon::with('speaker:id,name')
            ->published()
            ->latest('sermon_date')
            ->limit(4)
            ->get()
            ->map(fn (Sermon $s) => [
                'id' => $s->id,
                'title' => $s->title,
                'slug' => $s->slug,
                'speaker_name' => $s->speaker?->name,
                'sermon_date' => $s->sermon_date->toDateString(),
                'is_current_week' => $s->is_current_week,
            ]);

        $upcomingEvents = EventRegistration::with('event:id,title,slug,starts_at,location')
            ->where('user_id', $user->id)
            ->where('status', 'registered')
            ->whereHas('event', fn ($q) => $q->where('starts_at', '>=', now()))
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (EventRegistration $r) => [
                'id' => $r->id,
                'event_title' => $r->event->title,
                'event_slug' => $r->event->slug,
                'starts_at' => $r->event->starts_at->toDateTimeString(),
                'location' => $r->event->location,
            ]);

        $myMinistries = MinistryMember::with('ministry:id,name,slug')
            ->where('user_id', $user->id)
            ->latest('joined_at')
            ->limit(5)
            ->get()
            ->map(fn (MinistryMember $m) => [
                'id' => $m->id,
                'ministry_name' => $m->ministry->name,
                'ministry_slug' => $m->ministry->slug,
                'role' => $m->role->label(),
            ]);

        $upcomingDuties = VolunteerSchedule::with(['role:id,name', 'serviceTime:id,name'])
            ->where('user_id', $user->id)
            ->upcoming()
            ->orderBy('scheduled_date')
            ->limit(5)
            ->get()
            ->map(fn (VolunteerSchedule $s) => [
                'id' => $s->id,
                'role_name' => $s->role->name,
                'scheduled_date' => $s->scheduled_date->toDateString(),
                'service_time' => $s->serviceTime->name,
                'status' => $s->status->value,
            ]);

        return [
            'courseEnrollments' => $courseEnrollments,
            'readingPlanEnrollments' => $readingPlanEnrollments,
            'bookLendings' => $bookLendings,
            'recentSermons' => $recentSermons,
            'upcomingEvents' => $upcomingEvents,
            'myMinistries' => $myMinistries,
            'upcomingDuties' => $upcomingDuties,
        ];
    }
}
