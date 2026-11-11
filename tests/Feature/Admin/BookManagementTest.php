<?php

use App\Enums\CategoryType;
use App\Models\Book;
use App\Models\BookLending;
use App\Models\Category;
use App\Models\User;

it('denies member access to book listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.books.index'))
        ->assertForbidden();
});

it('allows staff to view book listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.books.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/books/index')
            ->has('books')
            ->has('filters')
            ->has('categories')
        );
});

it('shows the create book page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.books.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/books/create')
            ->has('categories')
        );
});

it('creates a book with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.books.store'), [
            'title' => 'Mere Christianity',
            'author' => 'C.S. Lewis',
            'isbn' => '9780060652920',
            'publisher' => 'HarperOne',
            'description' => '<p>A classic apologetics text.</p>',
            'total_copies' => 5,
            'available_copies' => 5,
            'location' => 'Shelf A1',
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.books.index'));

    expect(Book::where('title', 'Mere Christianity')->exists())->toBeTrue();
});

it('validates required fields when creating a book', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.books.store'), [])
        ->assertSessionHasErrors(['title', 'author']);
});

it('updates a book', function () {
    $staff = User::factory()->staff()->create();
    $book = Book::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.books.update', $book), [
            'title' => 'Updated Title',
            'author' => 'Updated Author',
            'total_copies' => 10,
            'available_copies' => 8,
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.books.index'));

    expect($book->fresh()->title)->toBe('Updated Title');
});

it('deletes a book', function () {
    $staff = User::factory()->staff()->create();
    $book = Book::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.books.destroy', $book))
        ->assertRedirect(route('admin.books.index'));

    expect(Book::find($book->id))->toBeNull();
});

it('searches books by title', function () {
    $staff = User::factory()->staff()->create();
    Book::factory()->create(['title' => 'The Bible Study Guide']);
    Book::factory()->create(['title' => 'Worship Songs Collection']);

    $this->actingAs($staff)
        ->get(route('admin.books.index', ['search' => 'Bible']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 1)
        );
});

it('filters books by category', function () {
    $staff = User::factory()->staff()->create();
    $category = Category::factory()->create(['type' => CategoryType::Book]);
    Book::factory()->create(['category_id' => $category->id]);
    Book::factory()->create(['category_id' => null]);

    $this->actingAs($staff)
        ->get(route('admin.books.index', ['category_id' => $category->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 1)
        );
});

it('displays lendings page', function () {
    $staff = User::factory()->staff()->create();
    BookLending::factory()->count(2)->create();

    $this->actingAs($staff)
        ->get(route('admin.books.lendings'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/books/lendings')
            ->has('lendings.data', 2)
        );
});

it('lends a book to a user', function () {
    $staff = User::factory()->staff()->create();
    $user = User::factory()->create();
    $book = Book::factory()->create(['available_copies' => 3]);

    $this->actingAs($staff)
        ->post(route('admin.books.lend', $book), [
            'user_id' => $user->id,
            'due_at' => now()->addWeeks(2)->format('Y-m-d'),
        ])
        ->assertRedirect();

    expect($book->fresh()->available_copies)->toBe(2)
        ->and(BookLending::where('book_id', $book->id)->where('user_id', $user->id)->exists())->toBeTrue();
});

it('prevents lending when no copies available', function () {
    $staff = User::factory()->staff()->create();
    $user = User::factory()->create();
    $book = Book::factory()->unavailable()->create();

    $this->actingAs($staff)
        ->post(route('admin.books.lend', $book), [
            'user_id' => $user->id,
            'due_at' => now()->addWeeks(2)->format('Y-m-d'),
        ])
        ->assertRedirect();

    expect(BookLending::where('book_id', $book->id)->exists())->toBeFalse();
});

it('returns a book and increments available copies', function () {
    $staff = User::factory()->staff()->create();
    $book = Book::factory()->create(['available_copies' => 2, 'total_copies' => 3]);
    $lending = BookLending::factory()->create(['book_id' => $book->id]);

    $this->actingAs($staff)
        ->patch(route('admin.lendings.return', $lending))
        ->assertRedirect();

    expect($lending->fresh()->isReturned())->toBeTrue()
        ->and($book->fresh()->available_copies)->toBe(3);
});

it('prevents returning an already returned book', function () {
    $staff = User::factory()->staff()->create();
    $lending = BookLending::factory()->returned()->create();

    $this->actingAs($staff)
        ->patch(route('admin.lendings.return', $lending))
        ->assertRedirect();

    // Should still have the original returned_at
    expect($lending->fresh()->isReturned())->toBeTrue();
});

it('filters lendings by status', function () {
    $staff = User::factory()->staff()->create();
    BookLending::factory()->create(); // active
    BookLending::factory()->overdue()->create(); // overdue
    BookLending::factory()->returned()->create(); // returned

    $this->actingAs($staff)
        ->get(route('admin.books.lendings', ['status' => 'active']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('lendings.data', 2) // active + overdue (both not returned)
        );
});

describe('books table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Book::factory()->create(['author' => 'Augustine', 'created_at' => now()->subDay()]);
        Book::factory()->create(['author' => 'Zwingli', 'created_at' => now()->subDays(2)]);

        $this->actingAs($staff)->get(route('admin.books.index', ['sort' => 'author', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('books.data.0.author', 'Zwingli')->where('filters.sort', 'author'));

        $this->actingAs($staff)->get(route('admin.books.index', ['sort' => 'isbn', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('books.data.0.author', 'Augustine')->where('filters.sort', null));
    });

    it('filters by several categories at once', function () {
        $first = Category::factory()->ofType(CategoryType::Book)->create();
        $second = Category::factory()->ofType(CategoryType::Book)->create();
        $other = Category::factory()->ofType(CategoryType::Book)->create();
        Book::factory()->create(['category_id' => $first->id]);
        Book::factory()->create(['category_id' => $second->id]);
        Book::factory()->create(['category_id' => $other->id]);

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.books.index', ['category_id' => [$first->id, $second->id]]))
            ->assertInertia(fn ($page) => $page->has('books.data', 2));
    });

    it('keeps the category filter when searching by author', function () {
        $category = Category::factory()->ofType(CategoryType::Book)->create();
        Book::factory()->create(['title' => 'Confessions', 'author' => 'Augustine', 'category_id' => $category->id]);
        Book::factory()->create(['title' => 'City of God', 'author' => 'Augustine']);

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.books.index', ['search' => 'Augustine', 'category_id' => [$category->id]]))
            ->assertInertia(fn ($page) => $page->has('books.data', 1)->where('books.data.0.title', 'Confessions'));
    });

    it('includes pagination meta', function () {
        Book::factory()->count(16)->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.books.index'))
            ->assertInertia(fn ($page) => $page->has('books.data', 15)->where('books.meta.total', 16));
    });
});

describe('lendings table', function () {
    it('filters by several statuses at once', function () {
        $staff = User::factory()->staff()->create();
        BookLending::factory()->create();
        BookLending::factory()->overdue()->create();
        BookLending::factory()->returned()->create();

        $this->actingAs($staff)->get(route('admin.books.lendings', ['status' => ['overdue', 'returned']]))
            ->assertInertia(fn ($page) => $page->has('lendings.data', 2)->where('filters.status', ['overdue', 'returned']));

        $this->actingAs($staff)->get(route('admin.books.lendings', ['status' => ['returned', 'bogus']]))
            ->assertInertia(fn ($page) => $page->has('lendings.data', 1)->where('filters.status', ['returned']));
    });

    it('sorts by due date and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        $soon = BookLending::factory()->create(['due_at' => now()->addDay(), 'borrowed_at' => now()->subDays(2)]);
        $later = BookLending::factory()->create(['due_at' => now()->addMonth(), 'borrowed_at' => now()->subDay()]);

        $this->actingAs($staff)->get(route('admin.books.lendings', ['sort' => 'due_at', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page->where('lendings.data.0.id', $soon->id)->where('filters.sort', 'due_at'));

        $this->actingAs($staff)->get(route('admin.books.lendings', ['sort' => 'user_id', 'direction' => 'asc']))
            ->assertInertia(fn ($page) => $page->where('lendings.data.0.id', $later->id)->where('filters.sort', null));
    });

    it('includes pagination meta', function () {
        BookLending::factory()->count(21)->create();

        $this->actingAs(User::factory()->staff()->create())
            ->get(route('admin.books.lendings'))
            ->assertInertia(fn ($page) => $page->has('lendings.data', 20)->where('lendings.meta.total', 21));
    });
});
