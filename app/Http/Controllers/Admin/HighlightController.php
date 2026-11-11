<?php

namespace App\Http\Controllers\Admin;

use App\Enums\HighlightType;
use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHighlightRequest;
use App\Http\Resources\HighlightResource;
use App\Models\Highlight;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class HighlightController extends Controller
{
    use ReadsTableQuery;

    /**
     * Columns the highlights table can be sorted by (sort key => database column).
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'title' => 'title',
        'type' => 'type',
        'priority' => 'priority',
        'dates' => 'starts_at',
        'status' => 'is_active',
    ];

    /**
     * Display a listing of highlights.
     */
    public function index(Request $request): Response
    {
        $types = $this->listInput($request, 'type');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $highlights = Highlight::query()
            ->with(['author'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($types, fn (Builder $query) => $query->whereIn('type', $types))
            ->when(
                $sort,
                fn (Builder $query) => $query->orderBy(self::SORTABLE[$sort], $direction),
                fn (Builder $query) => $query->orderByDesc('priority')->latest(),
            )
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'type' => $types,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Admin highlights listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/highlights/index', [
            'highlights' => HighlightResource::collection($highlights),
            'filters' => $filters,
            'types' => collect(HighlightType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new highlight.
     */
    public function create(): Response
    {
        return Inertia::render('admin/highlights/create', [
            'types' => collect(HighlightType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    /**
     * Store a newly created highlight.
     */
    public function store(StoreHighlightRequest $request): RedirectResponse
    {
        $highlight = Highlight::create([
            ...$request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']),
            'author_id' => $request->user()->id,
        ]);

        if ($request->hasFile('cover_image')) {
            $highlight->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($highlight, 'cover');
            Log::info('Library media copied to highlight', [
                'highlight_id' => $highlight->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Highlight created', [
            'highlight_id' => $highlight->id,
            'title' => $highlight->title,
            'type' => $highlight->type->value,
            'author_id' => $request->user()->id,
        ]);

        return redirect()->route('admin.highlights.index')
            ->with('success', "Highlight \"{$highlight->title}\" created.");
    }

    /**
     * Show the form for editing the specified highlight.
     */
    public function edit(Highlight $highlight): Response
    {
        return Inertia::render('admin/highlights/edit', [
            'highlight' => new HighlightResource($highlight->load('author')),
            'types' => collect(HighlightType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    /**
     * Update the specified highlight.
     */
    public function update(StoreHighlightRequest $request, Highlight $highlight): RedirectResponse
    {
        $highlight->update($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $highlight->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $highlight->clearMediaCollection('cover');
            $sourceMedia->copy($highlight, 'cover');
            Log::info('Library media copied to highlight', [
                'highlight_id' => $highlight->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $highlight->clearMediaCollection('cover');
        }

        Log::info('Highlight updated', [
            'highlight_id' => $highlight->id,
            'title' => $highlight->title,
            'type' => $highlight->type->value,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.highlights.index')
            ->with('success', "Highlight \"{$highlight->title}\" updated.");
    }

    /**
     * Remove the specified highlight.
     */
    public function destroy(Highlight $highlight): RedirectResponse
    {
        $title = $highlight->title;
        $highlightId = $highlight->id;

        $highlight->delete();

        Log::info('Highlight deleted', [
            'highlight_id' => $highlightId,
            'title' => $title,
        ]);

        return redirect()->route('admin.highlights.index')
            ->with('success', "Highlight \"{$title}\" deleted.");
    }
}
