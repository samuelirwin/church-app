<?php

namespace App\Http\Controllers\Public;

use App\Enums\CategoryType;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Category;
use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    /**
     * Display the public document listing.
     */
    public function index(Request $request): Response
    {
        $documents = Document::query()
            ->published()
            ->visibleTo($request->user())
            ->with('category')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->input('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/documents/index', [
            'documents' => DocumentResource::collection($documents),
            'filters' => $request->only(['search', 'category_id']),
            'categories' => Category::where('type', CategoryType::Document)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Display a single document's detail page.
     */
    public function show(Request $request, Document $document): Response
    {
        abort_unless($document->isPublished() && $document->isVisibleTo($request->user()), 404);

        return Inertia::render('public/documents/show', [
            'document' => new DocumentResource($document->load(['category', 'uploader', 'tags'])),
        ]);
    }
}
