<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSermonRequest;
use App\Http\Resources\SermonResource;
use App\Models\Sermon;
use App\Models\SermonSeries;
use App\Models\Speaker;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SermonController extends Controller
{
    use ReadsTableQuery;

    /**
     * Columns the sermons table can be sorted by (sort key => database column).
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'title' => 'title',
        'date' => 'sermon_date',
        'status' => 'published_at',
    ];

    /**
     * Display a listing of sermons.
     */
    public function index(Request $request): Response
    {
        $speakerIds = $this->listInput($request, 'speaker_id');
        $seriesIds = $this->listInput($request, 'series_id');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $sermons = Sermon::query()
            ->with(['speaker', 'series'])
            // Grouped so the OR on speaker name can't bypass the other filters.
            ->when($request->input('search'), fn (Builder $query, string $search) => $query->where(fn (Builder $q) => $q
                ->where('title', 'like', "%{$search}%")
                ->orWhereHas('speaker', fn (Builder $speaker) => $speaker->where('name', 'like', "%{$search}%"))))
            ->when($seriesIds, fn (Builder $query) => $query->whereIn('series_id', $seriesIds))
            ->when($speakerIds, fn (Builder $query) => $query->whereIn('speaker_id', $speakerIds))
            ->when($sort, fn (Builder $query) => $query->orderBy(self::SORTABLE[$sort], $direction), fn (Builder $query) => $query->latest('sermon_date'))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'speaker_id' => $speakerIds,
            'series_id' => $seriesIds,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Admin sermons listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/sermons/index', [
            'sermons' => SermonResource::collection($sermons),
            'filters' => $filters,
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
