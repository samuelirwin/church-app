<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSermonSeriesRequest;
use App\Http\Resources\SermonSeriesResource;
use App\Models\SermonSeries;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SermonSeriesController extends Controller
{
    /**
     * Display a listing of sermon series.
     */
    public function index(Request $request): Response
    {
        $series = SermonSeries::query()
            ->withCount('sermons')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/series/index', [
            'series' => SermonSeriesResource::collection($series),
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new series.
     */
    public function create(): Response
    {
        return Inertia::render('admin/series/create');
    }

    /**
     * Store a newly created series.
     */
    public function store(StoreSermonSeriesRequest $request): RedirectResponse
    {
        $series = SermonSeries::create($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $series->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($series, 'cover');
            Log::info('Library media copied to sermon series', [
                'series_id' => $series->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Sermon series created', [
            'series_id' => $series->id,
            'title' => $series->title,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.series.index')
            ->with('success', "Series \"{$series->title}\" created.");
    }

    /**
     * Show the form for editing the specified series.
     */
    public function edit(SermonSeries $series): Response
    {
        return Inertia::render('admin/series/edit', [
            'series' => new SermonSeriesResource($series),
        ]);
    }

    /**
     * Update the specified series.
     */
    public function update(StoreSermonSeriesRequest $request, SermonSeries $series): RedirectResponse
    {
        $series->update($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $series->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $series->clearMediaCollection('cover');
            $sourceMedia->copy($series, 'cover');
            Log::info('Library media copied to sermon series', [
                'series_id' => $series->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $series->clearMediaCollection('cover');
        }

        Log::info('Sermon series updated', [
            'series_id' => $series->id,
            'title' => $series->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.series.index')
            ->with('success', "Series \"{$series->title}\" updated.");
    }

    /**
     * Remove the specified series.
     */
    public function destroy(SermonSeries $series): RedirectResponse
    {
        $title = $series->title;
        $seriesId = $series->id;

        $series->delete();

        Log::info('Sermon series deleted', [
            'series_id' => $seriesId,
            'title' => $title,
        ]);

        return redirect()->route('admin.series.index')
            ->with('success', "Series \"{$title}\" deleted.");
    }
}
