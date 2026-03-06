<?php

use App\Models\Book;
use App\Models\BookLending;
use App\Models\Category;

it('auto-generates slug from title on creation', function () {
    $book = Book::factory()->create(['title' => 'The Art of Prayer']);

    expect($book->slug)->toBe('the-art-of-prayer');
});

it('belongs to a category', function () {
    $category = Category::factory()->create();
    $book = Book::factory()->create(['category_id' => $category->id]);

    expect($book->category->id)->toBe($category->id);
});

it('has many lendings', function () {
    $book = Book::factory()->create();
    BookLending::factory()->count(3)->create(['book_id' => $book->id]);

    expect($book->lendings)->toHaveCount(3);
});

it('scopes to published books only', function () {
    Book::factory()->published()->create();
    Book::factory()->unpublished()->create();

    expect(Book::published()->count())->toBe(1);
});

it('reports isAvailable correctly', function () {
    $available = Book::factory()->create(['available_copies' => 2]);
    $unavailable = Book::factory()->unavailable()->create();

    expect($available->isAvailable())->toBeTrue()
        ->and($unavailable->isAvailable())->toBeFalse();
});

it('reports isPublished correctly', function () {
    $published = Book::factory()->published()->create();
    $draft = Book::factory()->unpublished()->create();

    expect($published->isPublished())->toBeTrue()
        ->and($draft->isPublished())->toBeFalse();
});

it('casts numeric fields properly', function () {
    $book = Book::factory()->create([
        'total_copies' => '5',
        'available_copies' => '3',
    ]);

    $book = $book->fresh();

    expect($book->total_copies)->toBeInt()
        ->and($book->available_copies)->toBeInt()
        ->and($book->is_published)->toBeBool();
});

it('has lending scopes for active and overdue', function () {
    $book = Book::factory()->create();
    BookLending::factory()->create(['book_id' => $book->id]);
    BookLending::factory()->returned()->create(['book_id' => $book->id]);
    BookLending::factory()->overdue()->create(['book_id' => $book->id]);

    expect(BookLending::active()->count())->toBe(2)
        ->and(BookLending::overdue()->count())->toBe(1);
});

it('detects overdue lendings', function () {
    $overdue = BookLending::factory()->overdue()->create();
    $active = BookLending::factory()->create();
    $returned = BookLending::factory()->returned()->create();

    expect($overdue->isOverdue())->toBeTrue()
        ->and($active->isOverdue())->toBeFalse()
        ->and($returned->isOverdue())->toBeFalse();
});

it('tracks lending relationships', function () {
    $lending = BookLending::factory()->create();

    expect($lending->book)->toBeInstanceOf(Book::class)
        ->and($lending->user)->toBeInstanceOf(\App\Models\User::class)
        ->and($lending->lender)->toBeInstanceOf(\App\Models\User::class);
});
