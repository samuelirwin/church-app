<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EventCalendarDataController extends Controller
{
    /**
     * Return published events as JSON for the calendar view.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        $events = Event::query()
            ->published()
            ->with('category')
            ->where('starts_at', '>=', $request->input('start'))
            ->where('starts_at', '<=', $request->input('end'))
            ->when($request->input('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'start' => $event->starts_at->toIso8601String(),
                'end' => $event->ends_at?->toIso8601String() ?? $event->starts_at->addHour()->toIso8601String(),
                'allDay' => $event->is_all_day,
                'category' => $event->category ? [
                    'id' => $event->category->id,
                    'name' => $event->category->name,
                ] : null,
                'location' => $event->location,
            ]);

        Log::info('Calendar data fetched', [
            'start' => $request->input('start'),
            'end' => $request->input('end'),
            'event_count' => $events->count(),
        ]);

        return response()->json(['data' => $events]);
    }
}
