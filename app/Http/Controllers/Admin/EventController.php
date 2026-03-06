<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CategoryType;
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
    /**
     * Display a listing of events.
     */
    public function index(Request $request): Response
    {
        $events = Event::query()
            ->with('category')
            ->withCount('registrations')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            })
            ->when($request->input('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->latest('starts_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/events/index', [
            'events' => EventResource::collection($events),
            'filters' => $request->only(['search', 'category_id']),
            'categories' => Category::where('type', CategoryType::Event)->orderBy('name')->get(['id', 'name']),
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
     */
    public function edit(Event $event): Response
    {
        return Inertia::render('admin/events/edit', [
            'event' => new EventResource($event->load(['category', 'tags'])),
            'categories' => Category::where('type', CategoryType::Event)->orderBy('name')->get(['id', 'name']),
            'forms' => Form::query()->orderBy('title')->get(['id', 'title']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Update the specified event.
     */
    public function update(StoreEventRequest $request, Event $event): RedirectResponse
    {
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
     */
    public function destroy(Event $event): RedirectResponse
    {
        $title = $event->title;
        $eventId = $event->id;

        $event->delete();

        Log::info('Event deleted', [
            'event_id' => $eventId,
            'title' => $title,
        ]);

        return redirect()->route('admin.events.index')
            ->with('success', "Event \"{$title}\" deleted.");
    }

    /**
     * Display registrations for an event.
     */
    public function registrations(Request $request, Event $event): Response
    {
        $registrations = $event->registrations()
            ->with('user')
            ->when($request->input('status'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest('registered_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/events/registrations', [
            'event' => new EventResource($event),
            'registrations' => EventRegistrationResource::collection($registrations),
            'filters' => $request->only(['status']),
        ]);
    }
}
