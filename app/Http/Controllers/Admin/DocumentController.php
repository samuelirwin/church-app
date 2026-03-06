<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CategoryType;
use App\Enums\DocumentVisibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Category;
use App\Models\Document;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class DocumentController extends Controller
{
    /**
     * Display a listing of documents.
     */
    public function index(Request $request): Response
    {
        $documents = Document::query()
            ->with(['category', 'uploader'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($request->input('visibility'), function ($query, $visibility) {
                $query->where('visibility', $visibility);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/documents/index', [
            'documents' => DocumentResource::collection($documents),
            'filters' => $request->only(['search', 'category_id', 'visibility']),
            'categories' => Category::where('type', CategoryType::Document)->orderBy('name')->get(['id', 'name']),
            'visibilities' => collect(DocumentVisibility::cases())->map(fn ($v) => [
                'value' => $v->value,
                'label' => $v->label(),
            ]),
        ]);
    }

    /**
     * Show the form for creating a new document.
     */
    public function create(): Response
    {
        return Inertia::render('admin/documents/create', [
            'categories' => Category::where('type', CategoryType::Document)->orderBy('name')->get(['id', 'name']),
            'visibilities' => collect(DocumentVisibility::cases())->map(fn ($v) => [
                'value' => $v->value,
                'label' => $v->label(),
            ]),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Store a newly created document.
     */
    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $document = Document::create([
            ...$request->safe()->except(['tags', 'document_file', 'thumbnail_image', 'remove_thumbnail', 'library_media_id']),
            'uploaded_by' => $request->user()->id,
        ]);

        if (! empty($tags)) {
            $document->syncTags($tags);
        }

        if ($request->hasFile('document_file')) {
            $document->addMediaFromRequest('document_file')
                ->toMediaCollection('file');
        }

        if ($request->hasFile('thumbnail_image')) {
            $document->addMediaFromRequest('thumbnail_image')
                ->toMediaCollection('thumbnail');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($document, 'thumbnail');
            Log::info('Library media copied to document thumbnail', [
                'document_id' => $document->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Document created', [
            'document_id' => $document->id,
            'title' => $document->title,
            'visibility' => $document->visibility->value,
            'uploaded_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.documents.index')
            ->with('success', "Document \"{$document->title}\" created.");
    }

    /**
     * Show the form for editing the specified document.
     */
    public function edit(Document $document): Response
    {
        return Inertia::render('admin/documents/edit', [
            'document' => new DocumentResource($document->load(['category', 'uploader', 'tags'])),
            'categories' => Category::where('type', CategoryType::Document)->orderBy('name')->get(['id', 'name']),
            'visibilities' => collect(DocumentVisibility::cases())->map(fn ($v) => [
                'value' => $v->value,
                'label' => $v->label(),
            ]),
            'allTags' => Tag::query()->ordered()->pluck('name'),
        ]);
    }

    /**
     * Update the specified document.
     */
    public function update(StoreDocumentRequest $request, Document $document): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $document->update($request->safe()->except(['tags', 'document_file', 'thumbnail_image', 'remove_thumbnail', 'library_media_id']));

        $document->syncTags($tags);

        if ($request->hasFile('document_file')) {
            $document->addMediaFromRequest('document_file')
                ->toMediaCollection('file');
        }

        if ($request->hasFile('thumbnail_image')) {
            $document->addMediaFromRequest('thumbnail_image')
                ->toMediaCollection('thumbnail');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $document->clearMediaCollection('thumbnail');
            $sourceMedia->copy($document, 'thumbnail');
            Log::info('Library media copied to document thumbnail', [
                'document_id' => $document->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_thumbnail')) {
            $document->clearMediaCollection('thumbnail');
        }

        Log::info('Document updated', [
            'document_id' => $document->id,
            'title' => $document->title,
            'visibility' => $document->visibility->value,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.documents.index')
            ->with('success', "Document \"{$document->title}\" updated.");
    }

    /**
     * Remove the specified document.
     */
    public function destroy(Document $document): RedirectResponse
    {
        $title = $document->title;
        $documentId = $document->id;

        $document->delete();

        Log::info('Document deleted', [
            'document_id' => $documentId,
            'title' => $title,
        ]);

        return redirect()->route('admin.documents.index')
            ->with('success', "Document \"{$title}\" deleted.");
    }
}
