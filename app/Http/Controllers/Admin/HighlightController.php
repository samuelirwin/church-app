<?php

namespace App\Http\Controllers\Admin;

use App\Enums\HighlightType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHighlightRequest;
use App\Http\Resources\HighlightResource;
use App\Models\Highlight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class HighlightController extends Controller
{
    /**
     * Display a listing of highlights.
     */
    public function index(Request $request): Response
    {
        $highlights = Highlight::query()
            ->with(['author'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('type'), function ($query, $type) {
                $query->where('type', $type);
            })
            ->orderByDesc('priority')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/highlights/index', [
            'highlights' => HighlightResource::collection($highlights),
            'filters' => $request->only(['search', 'type']),
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
