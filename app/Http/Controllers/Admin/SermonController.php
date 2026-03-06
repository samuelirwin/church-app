<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSermonRequest;
use App\Http\Resources\SermonResource;
use App\Models\Sermon;
use App\Models\SermonSeries;
use App\Models\Speaker;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SermonController extends Controller
{
    /**
     * Display a listing of sermons.
     */
    public function index(Request $request): Response
    {
        $sermons = Sermon::query()
            ->with(['speaker', 'series'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhereHas('speaker', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            })
            ->when($request->input('series_id'), function ($query, $seriesId) {
                $query->where('series_id', $seriesId);
            })
            ->when($request->input('speaker_id'), function ($query, $speakerId) {
                $query->where('speaker_id', $speakerId);
            })
            ->latest('sermon_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/sermons/index', [
            'sermons' => SermonResource::collection($sermons),
            'filters' => $request->only(['search', 'series_id', 'speaker_id']),
            'speakers' => Speaker::orderBy('name')->get(['id', 'name']),
            'seriesList' => SermonSeries::orderBy('title')->get(['id', 'title']),
        ]);
    }

    /**
     * Show the form for creating a new sermon.
     */
    public function create(): Response
    {
        return Inertia::render('admin/sermons/create', [
            'speakers' => Speaker::orderBy('name')->get(['id', 'name']),
            'seriesList' => SermonSeries::active()->orderBy('title')->get(['id', 'title']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Store a newly created sermon.
     */
    public function store(StoreSermonRequest $request): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $sermon = Sermon::create([
            ...$request->safe()->except(['tags', 'cover_image', 'remove_cover', 'library_media_id']),
            'created_by' => $request->user()->id,
        ]);

        if (! empty($tags)) {
            $sermon->syncTags($tags);
        }

        if ($request->hasFile('cover_image')) {
            $sermon->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($sermon, 'cover');
            Log::info('Library media copied to sermon', [
                'sermon_id' => $sermon->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Sermon created', [
            'sermon_id' => $sermon->id,
            'title' => $sermon->title,
            'speaker_id' => $sermon->speaker_id,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.sermons.index')
            ->with('success', "Sermon \"{$sermon->title}\" created.");
    }

    /**
     * Show the form for editing the specified sermon.
     */
    public function edit(Sermon $sermon): Response
    {
        return Inertia::render('admin/sermons/edit', [
            'sermon' => new SermonResource($sermon->load(['speaker', 'series', 'tags'])),
            'speakers' => Speaker::orderBy('name')->get(['id', 'name']),
            'seriesList' => SermonSeries::orderBy('title')->get(['id', 'title']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Update the specified sermon.
     */
    public function update(StoreSermonRequest $request, Sermon $sermon): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $sermon->update($request->safe()->except(['tags', 'cover_image', 'remove_cover', 'library_media_id']));

        $sermon->syncTags($tags);

        if ($request->hasFile('cover_image')) {
            $sermon->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sermon->clearMediaCollection('cover');
            $sourceMedia->copy($sermon, 'cover');
            Log::info('Library media copied to sermon', [
                'sermon_id' => $sermon->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $sermon->clearMediaCollection('cover');
        }

        Log::info('Sermon updated', [
            'sermon_id' => $sermon->id,
            'title' => $sermon->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.sermons.index')
            ->with('success', "Sermon \"{$sermon->title}\" updated.");
    }

    /**
     * Remove the specified sermon.
     */
    public function destroy(Sermon $sermon): RedirectResponse
    {
        $title = $sermon->title;
        $sermonId = $sermon->id;

        $sermon->delete();

        Log::info('Sermon deleted', [
            'sermon_id' => $sermonId,
            'title' => $title,
        ]);

        return redirect()->route('admin.sermons.index')
            ->with('success', "Sermon \"{$title}\" deleted.");
    }
}
