<?php

use App\Enums\CategoryType;
use App\Models\Book;
use App\Models\Category;

it('displays the public library page', function () {
    Book::factory()->published()->count(3)->create();

    $this->get(route('books.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/library/index')
            ->has('books.data', 3)
            ->has('filters')
            ->has('categories')
        );
});

it('only shows published books in the catalog', function () {
    Book::factory()->published()->count(2)->create();
    Book::factory()->unpublished()->create();

    $this->get(route('books.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 2)
        );
});

it('searches books by title', function () {
    Book::factory()->published()->create(['title' => 'Streams in the Desert']);
    Book::factory()->published()->create(['title' => 'Celebration of Discipline']);

    $this->get(route('books.index', ['search' => 'Streams']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 1)
        );
});

it('searches books by author', function () {
    Book::factory()->published()->create(['author' => 'John Piper']);
    Book::factory()->published()->create(['author' => 'Tim Keller']);

    $this->get(route('books.index', ['search' => 'Piper']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 1)
        );
});

it('filters books by category', function () {
    $category = Category::factory()->create(['type' => CategoryType::Book]);
    Book::factory()->published()->create(['category_id' => $category->id]);
    Book::factory()->published()->create(['category_id' => null]);

    $this->get(route('books.index', ['category_id' => $category->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('books.data', 1)
        );
});

it('shows a published book detail page', function () {
    $book = Book::factory()->published()->create();

    $this->get(route('books.show', $book))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/library/show')
            ->has('book.data')
        );
});

it('returns 404 for unpublished book', function () {
    $book = Book::factory()->unpublished()->create();

    $this->get(route('books.show', $book))
        ->assertNotFound();
});
