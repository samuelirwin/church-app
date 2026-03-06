<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\SermonResource;
use App\Http\Resources\SermonSeriesResource;
use App\Models\SermonSeries;
use Inertia\Inertia;
use Inertia\Response;

class SeriesController extends Controller
{
    /**
     * Display a listing of sermon series.
     */
    public function index(): Response
    {
        $series = SermonSeries::query()
            ->withCount('sermons')
            ->with('media')
            ->whereHas('sermons')
            ->orderByDesc('start_date')
            ->paginate(12);

        return Inertia::render('public/series/index', [
            'series' => SermonSeriesResource::collection($series),
        ]);
    }

    /**
     * Display the specified series and its sermons.
     */
    public function show(SermonSeries $series): Response
    {
        $series->load('media');

        $sermons = $series->sermons()
            ->published()
            ->with(['speaker', 'media'])
            ->orderByDesc('sermon_date')
            ->paginate(12);

        return Inertia::render('public/series/show', [
            'series' => new SermonSeriesResource($series),
            'sermons' => SermonResource::collection($sermons),
        ]);
    }
}
