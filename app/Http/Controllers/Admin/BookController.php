<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CategoryType;
use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBookRequest;
use App\Http\Resources\BookLendingResource;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Models\BookLending;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BookController extends Controller
{
    use ReadsTableQuery;

    /**
     * Sortable columns for the books table, keyed by the sort value the page sends.
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'title' => 'title',
        'author' => 'author',
        'copies' => 'available_copies',
        'status' => 'is_published',
    ];

    /**
     * Sortable columns for the lendings table.
     *
     * @var array<string, string>
     */
    private const LENDING_SORTABLE = [
        'borrowed_at' => 'borrowed_at',
        'due_at' => 'due_at',
        'returned_at' => 'returned_at',
    ];

    /**
     * Lending status filters. Several can be picked; a lending matches if it fits any of them.
     *
     * @var list<string>
     */
    private const LENDING_STATUSES = ['active', 'overdue', 'returned'];

    /**
     * Library catalogue. Newest first unless the user picks a column to sort by.
     */
    public function index(Request $request): Response
    {
        $categoryIds = $this->listInput($request, 'category_id');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $books = Book::query()
            ->with('category')
            // Grouped so the OR can't escape the category filter.
            ->when($request->input('search'), fn ($query, $search) => $query->where(fn ($q) => $q
                ->where('title', 'like', "%{$search}%")
                ->orWhere('author', 'like', "%{$search}%")))
            ->when($categoryIds, fn ($query) => $query->whereIn('category_id', $categoryIds))
            ->when($sort, fn ($query) => $query->orderBy(self::SORTABLE[$sort], $direction), fn ($query) => $query->latest())
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'category_id' => $categoryIds,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Books listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/books/index', [
            'books' => BookResource::collection($books),
            'filters' => $filters,
            'categories' => Category::where('type', CategoryType::Book)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new book.
     */
    public function create(): Response
    {
        return Inertia::render('admin/books/create', [
            'categories' => Category::where('type', CategoryType::Book)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created book.
     */
    public function store(StoreBookRequest $request): RedirectResponse
    {
        $book = Book::create($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $book->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($book, 'cover');
            Log::info('Library media copied to book', [
                'book_id' => $book->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Book created', [
            'book_id' => $book->id,
            'title' => $book->title,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.books.index')
            ->with('success', "Book \"{$book->title}\" added to library.");
    }

    /**
     * Show the form for editing the specified book.
     */
    public function edit(Book $book): Response
    {
        return Inertia::render('admin/books/edit', [
            'book' => new BookResource($book->load('category')),
            'categories' => Category::where('type', CategoryType::Book)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified book.
     */
    public function update(StoreBookRequest $request, Book $book): RedirectResponse
    {
        $book->update($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $book->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $book->clearMediaCollection('cover');
            $sourceMedia->copy($book, 'cover');
            Log::info('Library media copied to book', [
                'book_id' => $book->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $book->clearMediaCollection('cover');
        }

        Log::info('Book updated', [
            'book_id' => $book->id,
            'title' => $book->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.books.index')
            ->with('success', "Book \"{$book->title}\" updated.");
    }

    /**
     * Remove the specified book.
     */
    public function destroy(Book $book): RedirectResponse
    {
        $title = $book->title;
        $bookId = $book->id;

        $book->delete();

        Log::info('Book deleted', [
            'book_id' => $bookId,
            'title' => $title,
        ]);

        return redirect()->route('admin.books.index')
            ->with('success', "Book \"{$title}\" removed from library.");
    }

    /**
     * All lendings. Most recently borrowed first unless the user picks a column to sort by.
     */
    public function lendings(Request $request): Response
    {
        $statuses = array_values(array_intersect($this->listInput($request, 'status'), self::LENDING_STATUSES));
        [$sort, $direction] = $this->sortInput($request, self::LENDING_SORTABLE);

        $lendings = BookLending::query()
            ->with(['book', 'user', 'lender'])
            ->when($statuses, fn ($query) => $query->where(function ($q) use ($statuses) {
                foreach ($statuses as $status) {
                    match ($status) {
                        'active' => $q->orWhere(fn ($inner) => $inner->active()),
                        'overdue' => $q->orWhere(fn ($inner) => $inner->overdue()),
                        'returned' => $q->orWhereNotNull('returned_at'),
                    };
                }
            }))
            ->when($sort, fn ($query) => $query->orderBy(self::LENDING_SORTABLE[$sort], $direction), fn ($query) => $query->latest('borrowed_at'))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        $filters = [
            'status' => $statuses,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Book lendings listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/books/lendings', [
            'lendings' => BookLendingResource::collection($lendings),
            'filters' => $filters,
        ]);
    }

    /**
     * Lend a book to a user.
     */
    public function lend(Request $request, Book $book): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'due_at' => ['required', 'date', 'after:today'],
            'notes' => ['nullable', 'string'],
        ]);

        if (! $book->isAvailable()) {
            return redirect()->back()
                ->with('error', 'No copies available for lending.');
        }

        BookLending::create([
            'book_id' => $book->id,
            'user_id' => $validated['user_id'],
            'borrowed_at' => now(),
            'due_at' => $validated['due_at'],
            'notes' => $validated['notes'] ?? null,
            'lent_by' => $request->user()->id,
        ]);

        $book->decrement('available_copies');

        Log::info('Book lent', [
            'book_id' => $book->id,
            'user_id' => $validated['user_id'],
            'lent_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', "Book \"{$book->title}\" lent successfully.");
    }

    /**
     * Mark a lending as returned.
     */
    public function returnBook(Request $request, BookLending $lending): RedirectResponse
    {
        if ($lending->isReturned()) {
            return redirect()->back()
                ->with('error', 'This book has already been returned.');
        }

        $lending->update([
            'returned_at' => now(),
            'returned_to' => $request->user()->id,
        ]);

        $lending->book->increment('available_copies');

        Log::info('Book returned', [
            'lending_id' => $lending->id,
            'book_id' => $lending->book_id,
            'user_id' => $lending->user_id,
            'returned_to' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', "Book \"{$lending->book->title}\" returned.");
    }
}
