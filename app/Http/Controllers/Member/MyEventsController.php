<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\EventRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MyEventsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $upcoming = EventRegistration::with('event:id,title,slug,starts_at,ends_at,location')
            ->where('user_id', $user->id)
            ->where('status', 'registered')
            ->whereHas('event', fn ($q) => $q->where('starts_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (EventRegistration $r): array => [
                'id' => $r->id,
                'event_title' => $r->event->title,
                'event_slug' => $r->event->slug,
                'starts_at' => $r->event->starts_at->toDateTimeString(),
                'ends_at' => $r->event->ends_at?->toDateTimeString(),
                'location' => $r->event->location,
                'registered_at' => $r->registered_at->toDateString(),
            ]);

        $past = EventRegistration::with('event:id,title,slug,starts_at,location')
            ->where('user_id', $user->id)
            ->where('status', 'registered')
            ->whereHas('event', fn ($q) => $q->where('starts_at', '<', now()))
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (EventRegistration $r): array => [
                'id' => $r->id,
                'event_title' => $r->event->title,
                'event_slug' => $r->event->slug,
                'starts_at' => $r->event->starts_at->toDateTimeString(),
                'location' => $r->event->location,
            ]);

        Log::info('My events viewed', [
            'user_id' => $user->id,
            'upcoming_count' => $upcoming->count(),
            'past_count' => $past->count(),
        ]);

        return Inertia::render('member/events/index', [
            'upcoming' => $upcoming,
            'past' => $past,
        ]);
    }
}
