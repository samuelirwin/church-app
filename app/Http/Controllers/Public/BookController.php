<?php

namespace App\Http\Controllers\Public;

use App\Enums\CategoryType;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    /**
     * Display the public book catalog.
     */
    public function index(Request $request): Response
    {
        $books = Book::query()
            ->published()
            ->with('category')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('author', 'like', "%{$search}%");
                });
            })
            ->when($request->input('category_id'), function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/library/index', [
            'books' => BookResource::collection($books),
            'filters' => $request->only(['search', 'category_id']),
            'categories' => Category::where('type', CategoryType::Book)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Display a single book's detail page.
     */
    public function show(Book $book): Response
    {
        abort_unless($book->isPublished(), 404);

        return Inertia::render('public/library/show', [
            'book' => new BookResource($book->load(['category', 'media'])),
        ]);
    }
}
