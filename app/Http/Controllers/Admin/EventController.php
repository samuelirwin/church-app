<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CategoryType;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Resources\EventRegistrationResource;
use App\Http\Resources\EventResource;
use App\Models\Category;
use App\Models\Event;
use App\Models\Form;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class EventController extends Controller
{
    use ReadsTableQuery;

    /**
     * Sortable columns for the events table (key => column).
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'title' => 'title',
        'starts_at' => 'starts_at',
        'registrations' => 'registrations_count',
        'status' => 'is_published',
    ];

    /**
     * Sortable columns for an event's registrations table.
     *
     * @var array<string, string>
     */
    private const REGISTRATION_SORTABLE = [
        'name' => 'name',
        'status' => 'status',
        'registered_at' => 'registered_at',
    ];

    /**
     * Events list. Leaders only see events they created.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $categoryIds = $this->listInput($request, 'category_id');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $events = Event::query()
            ->with('category')
            ->withCount('registrations')
            ->when(! $user->isStaffOrAbove(), function ($query) use ($user) {
                $query->where('created_by', $user->id);
            })
            // Grouped so the OR can't widen a leader's scope to other people's events.
            ->when($request->input('search'), function ($query, $search) {
                $query->where(fn ($q) => $q
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%"));
            })
            ->when($categoryIds, fn ($query) => $query->whereIn('category_id', $categoryIds))
            ->when($sort, fn ($query) => $query->orderBy(self::SORTABLE[$sort], $direction), fn ($query) => $query->latest('starts_at'))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'category_id' => $categoryIds,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Admin events listing viewed', ['user_id' => $user->id, 'filters' => $filters]);

        return Inertia::render('admin/events/index', [
            'events' => EventResource::collection($events),
            'filters' => $filters,
            'categories' => Category::where('type', CategoryType::Event)->orderBy('name')->get(['id', 'name']),
            'canCreate' => true,
            'isStaffOrAbove' => $user->isStaffOrAbove(),
        ]);
    }

    /**
     * Show the form for creating a new event.
     */
    public function create(): Response
    {
        return Inertia::render('admin/events/create', [
            'categories' => Category::where('type', CategoryType::Event)->orderBy('name')->get(['id', 'name']),
            'forms' => Form::query()->orderBy('title')->get(['id', 'title']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Store a newly created event.
     */
    public function store(StoreEventRequest $request): RedirectResponse
    {
        $event = Event::create([
            ...$request->safe()->except(['tags', 'cover_image', 'remove_cover', 'library_media_id']),
            'created_by' => $request->user()->id,
        ]);

        if ($request->has('tags')) {
            $event->syncTags($request->input('tags', []));
        }

        if ($request->hasFile('cover_image')) {
            $event->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($event, 'cover');
            Log::info('Library media copied to event', [
                'event_id' => $event->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Event created', [
            'event_id' => $event->id,
            'title' => $event->title,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.events.index')
            ->with('success', "Event \"{$event->title}\" created.");
    }

    /**
     * Show the form for editing the specified event.
     * Leaders can only edit events they created.
     */
    public function edit(Request $request, Event $event): Response
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $event->created_by === $user->id, 403);

        return Inertia::render('admin/events/edit', [
            'event' => new EventResource($event->load(['category', 'tags'])),
            'categories' => Category::where('type', CategoryType::Event)->orderBy('name')->get(['id', 'name']),
            'forms' => Form::query()->orderBy('title')->get(['id', 'title']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Update the specified event.
     * Leaders can only update events they created.
     */
    public function update(StoreEventRequest $request, Event $event): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $event->created_by === $user->id, 403);

        $event->update($request->safe()->except(['tags', 'cover_image', 'remove_cover', 'library_media_id']));

        if ($request->has('tags')) {
            $event->syncTags($request->input('tags', []));
        }

        if ($request->hasFile('cover_image')) {
            $event->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $event->clearMediaCollection('cover');
            $sourceMedia->copy($event, 'cover');
            Log::info('Library media copied to event', [
                'event_id' => $event->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $event->clearMediaCollection('cover');
        }

        Log::info('Event updated', [
            'event_id' => $event->id,
            'title' => $event->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.events.index')
            ->with('success', "Event \"{$event->title}\" updated.");
    }

    /**
     * Remove the specified event.
     * Leaders can only delete events they created.
     */
    public function destroy(Request $request, Event $event): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $event->created_by === $user->id, 403);

        $title = $event->title;
        $eventId = $event->id;

        $event->delete();

        Log::info('Event deleted', [
            'event_id' => $eventId,
            'title' => $title,
            'deleted_by' => $user->id,
        ]);

        return redirect()->route('admin.events.index')
            ->with('success', "Event \"{$title}\" deleted.");
    }

    public function registrations(Request $request, Event $event): Response
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $event->created_by === $user->id, 403);

        $statuses = $this->listInput($request, 'status');
        [$sort, $direction] = $this->sortInput($request, self::REGISTRATION_SORTABLE);

        $registrations = $event->registrations()
            ->with('user')
            ->when($statuses, fn ($query) => $query->whereIn('status', $statuses))
            ->when($sort, fn ($query) => $query->orderBy(self::REGISTRATION_SORTABLE[$sort], $direction), fn ($query) => $query->latest('registered_at'))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $filters = ['status' => $statuses, 'sort' => $sort, 'direction' => $sort ? $direction : null];

        Log::info('Event registrations viewed', ['event_id' => $event->id, 'user_id' => $user->id, 'filters' => $filters]);

        return Inertia::render('admin/events/registrations', [
            'event' => new EventResource($event),
            'registrations' => EventRegistrationResource::collection($registrations),
            'filters' => $filters,
            'statuses' => array_map(
                fn (RegistrationStatus $status) => ['value' => $status->value, 'label' => $status->label()],
                RegistrationStatus::cases(),
            ),
        ]);
    }
}
