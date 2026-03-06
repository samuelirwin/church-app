<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\SermonResource;
use App\Models\Sermon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SermonController extends Controller
{
    /**
     * Display a listing of published sermons.
     */
    public function index(Request $request): Response
    {
        $sermons = Sermon::query()
            ->published()
            ->with(['speaker', 'series', 'media'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhereHas('speaker', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            })
            ->when($request->input('series'), function ($query, $seriesSlug) {
                $query->whereHas('series', fn ($q) => $q->where('slug', $seriesSlug));
            })
            ->latest('sermon_date')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/sermons/index', [
            'sermons' => SermonResource::collection($sermons),
            'filters' => $request->only(['search', 'series']),
        ]);
    }

    /**
     * Display the specified published sermon.
     */
    public function show(Sermon $sermon): Response
    {
        abort_unless($sermon->isPublished(), 404);

        $sermon->load(['speaker.media', 'series', 'media', 'resources.media', 'tags']);

        $relatedSermons = Sermon::query()
            ->published()
            ->with(['speaker', 'media'])
            ->where('id', '!=', $sermon->id)
            ->when($sermon->series_id, fn ($q) => $q->where('series_id', $sermon->series_id))
            ->when(! $sermon->series_id, fn ($q) => $q->where('speaker_id', $sermon->speaker_id))
            ->latest('sermon_date')
            ->limit(4)
            ->get();

        return Inertia::render('public/sermons/show', [
            'sermon' => new SermonResource($sermon),
            'relatedSermons' => SermonResource::collection($relatedSermons),
        ]);
    }
}
