<?php

namespace App\Services;

use App\Enums\FollowUpStatus;
use App\Enums\MembershipStatus;
use App\Enums\RegistrationStatus;
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
use App\Models\ReadingPlanEnrollment;
use App\Models\Sermon;
use App\Models\User;
use App\Models\Visitor;
use App\Models\VolunteerSchedule;

/**
 * The "at a glance" part of the admin dashboard: current state (not tied to the
 * period picker), shaped for charts and short tables instead of lone numbers.
 * Each method feeds one dashboard card, so they can be loaded independently.
 */
class DashboardOverviewService
{
    /**
     * How many rows the short tables (duties, events) and the ministry chart show.
     */
    public const LIST_LIMIT = 6;

    public const MINISTRY_LIMIT = 8;

    /**
     * Things someone should act on. Care need counts respect the viewer's
     * visibility so confidential needs aren't leaked as numbers.
     *
     * @return list<array{key: string, label: string, description: string, value: int, href: string|null}>
     */
    public function attention(User $user): array
    {
        return [
            [
                'key' => 'my_care_needs',
                'label' => 'My care needs',
                'description' => 'Open needs assigned to you',
                'value' => CareNeed::query()->visibleTo($user)->active()->where('assigned_to', $user->id)->count(),
                'href' => route('admin.care-needs.index', ['assigned' => 'me']),
            ],
            [
                'key' => 'overdue_care_needs',
                'label' => 'Overdue care needs',
                'description' => 'Past their follow-up date',
                'value' => CareNeed::query()->visibleTo($user)->overdue()->count(),
                'href' => route('admin.care-needs.index', ['overdue' => 1]),
            ],
            [
                'key' => 'new_visitors',
                'label' => 'Visitors to contact',
                'description' => 'Not contacted yet',
                'value' => Visitor::query()->byStatus(FollowUpStatus::New)->count(),
                'href' => route('admin.visitors.index', ['status' => FollowUpStatus::New->value]),
            ],
            [
                'key' => 'overdue_lendings',
                'label' => 'Overdue books',
                'description' => 'Lent out past the due date',
                'value' => BookLending::query()->overdue()->count(),
                // The lendings page is staff+, so leaders get the number without a dead link.
                'href' => $user->isStaffOrAbove() ? route('admin.books.lendings') : null,
            ],
        ];
    }

    /**
     * Members per membership status, in the enum's order (empty statuses included,
     * so the chart always has the same rows).
     *
     * @return array{statuses: list<array{label: string, value: int}>, activeMembers: int, userAccounts: int}
     */
    public function membership(): array
    {
        $counts = Member::query()
            ->toBase()
            ->selectRaw('membership_status, count(*) as total')
            ->groupBy('membership_status')
            ->pluck('total', 'membership_status');

        $statuses = collect(MembershipStatus::cases())
            ->map(fn (MembershipStatus $status) => [
                'label' => $status->label(),
                'value' => (int) ($counts[$status->value] ?? 0),
            ])
            ->values()
            ->all();

        return [
            'statuses' => $statuses,
            'activeMembers' => Member::query()->active()->count(),
            'userAccounts' => User::query()->count(),
        ];
    }

    /**
     * Visitors at each follow-up stage, in pipeline order.
     *
     * @return list<array{label: string, value: int}>
     */
    public function visitorPipeline(): array
    {
        $counts = Visitor::query()
            ->toBase()
            ->selectRaw('follow_up_status, count(*) as total')
            ->groupBy('follow_up_status')
            ->pluck('total', 'follow_up_status');

        return collect(FollowUpStatus::cases())
            ->map(fn (FollowUpStatus $status) => [
                'label' => $status->label(),
                'value' => (int) ($counts[$status->value] ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * The next volunteer duties, soonest first, plus the total still to come.
     *
     * @return array{total: int, rows: list<array{id: int, date: string, service: string|null, role: string|null, volunteer: string|null, status: string, statusLabel: string}>}
     */
    public function upcomingDuties(): array
    {
        $rows = VolunteerSchedule::query()
            ->upcoming()
            ->with(['role:id,name', 'user:id,name', 'serviceTime:id,name'])
            ->orderBy('scheduled_date')
            ->orderBy('id')
            ->limit(self::LIST_LIMIT)
            ->get()
            ->map(fn (VolunteerSchedule $schedule) => [
                'id' => $schedule->id,
                'date' => $schedule->scheduled_date->toDateString(),
                'service' => $schedule->serviceTime?->name,
                'role' => $schedule->role?->name,
                'volunteer' => $schedule->user?->name,
                'status' => $schedule->status->value,
                'statusLabel' => $schedule->status->label(),
            ])
            ->all();

        return [
            'total' => VolunteerSchedule::query()->upcoming()->count(),
            'rows' => $rows,
        ];
    }

    /**
     * The next events with how full they are. Cancelled registrations don't count.
     *
     * @return array{total: int, rows: list<array{id: int, title: string, startsAt: string, registrations: int, capacity: int|null, href: string}>}
     */
    public function upcomingEvents(): array
    {
        $rows = Event::query()
            ->upcoming()
            ->withCount(['registrations' => fn ($query) => $query->where('status', '!=', RegistrationStatus::Cancelled)])
            ->orderBy('starts_at')
            ->limit(self::LIST_LIMIT)
            ->get(['id', 'title', 'starts_at', 'max_attendees'])
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'startsAt' => $event->starts_at->toIso8601String(),
                'registrations' => $event->registrations_count,
                'capacity' => $event->max_attendees,
                'href' => route('admin.events.registrations', $event),
            ])
            ->all();

        return [
            'total' => Event::query()->upcoming()->count(),
            'rows' => $rows,
        ];
    }

    /**
     * The biggest ministries by member count, plus overall ministry and group totals.
     *
     * @return array{rows: list<array{label: string, value: int}>, totalMinistries: int, totalGroups: int}
     */
    public function ministries(): array
    {
        $rows = Ministry::query()
            ->withCount('users')
            ->orderByDesc('users_count')
            ->orderBy('name')
            ->limit(self::MINISTRY_LIMIT)
            ->get(['id', 'name'])
            ->map(fn (Ministry $ministry) => [
                'label' => $ministry->name,
                'value' => $ministry->users_count,
            ])
            ->all();

        return [
            'rows' => $rows,
            'totalMinistries' => Ministry::query()->count(),
            'totalGroups' => MinistryGroup::query()->count(),
        ];
    }

    /**
     * How much content the church has published or set up, by type.
     *
     * @return list<array{label: string, value: int}>
     */
    public function contentLibrary(): array
    {
        return [
            ['label' => 'Sermons', 'value' => Sermon::query()->count()],
            ['label' => 'Posts', 'value' => Post::query()->count()],
            ['label' => 'Courses', 'value' => Course::query()->count()],
            ['label' => 'Reading plans', 'value' => ReadingPlan::query()->count()],
            ['label' => 'Books', 'value' => Book::query()->count()],
            ['label' => 'Forms', 'value' => Form::query()->count()],
        ];
    }

    /**
     * How people are using that content.
     *
     * @return list<array{label: string, value: int}>
     */
    public function engagement(): array
    {
        return [
            ['label' => 'Course enrollments', 'value' => CourseEnrollment::query()->count()],
            ['label' => 'Courses completed', 'value' => CourseEnrollment::query()->whereNotNull('completed_at')->count()],
            ['label' => 'Reading plan enrollments', 'value' => ReadingPlanEnrollment::query()->count()],
            ['label' => 'Form responses', 'value' => FormResponse::query()->count()],
            ['label' => 'Books on loan', 'value' => BookLending::query()->active()->count()],
        ];
    }
}
