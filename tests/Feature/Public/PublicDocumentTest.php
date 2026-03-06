<?php

use App\Enums\CategoryType;
use App\Models\Category;
use App\Models\Document;
use App\Models\User;

it('displays the public documents page', function () {
    Document::factory()->published()->public()->count(3)->create();

    $this->get(route('documents.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/documents/index')
            ->has('documents.data', 3)
            ->has('filters')
            ->has('categories')
        );
});

it('only shows published documents', function () {
    Document::factory()->published()->count(2)->create();
    Document::factory()->unpublished()->create();

    $this->get(route('documents.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 2)
        );
});

it('guests only see public documents', function () {
    Document::factory()->published()->public()->create();
    Document::factory()->published()->membersOnly()->create();
    Document::factory()->published()->adminOnly()->create();

    $this->get(route('documents.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 1)
        );
});

it('members see public and members-only documents', function () {
    $member = User::factory()->create();
    Document::factory()->published()->public()->create();
    Document::factory()->published()->membersOnly()->create();
    Document::factory()->published()->adminOnly()->create();

    $this->actingAs($member)
        ->get(route('documents.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 2)
        );
});

it('staff see all visibility levels', function () {
    $staff = User::factory()->staff()->create();
    Document::factory()->published()->public()->create();
    Document::factory()->published()->membersOnly()->create();
    Document::factory()->published()->adminOnly()->create();

    $this->actingAs($staff)
        ->get(route('documents.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 3)
        );
});

it('searches documents by title', function () {
    Document::factory()->published()->create(['title' => 'Annual Report']);
    Document::factory()->published()->create(['title' => 'Weekly Bulletin']);

    $this->get(route('documents.index', ['search' => 'Annual']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 1)
        );
});

it('filters documents by category', function () {
    $category = Category::factory()->create(['type' => CategoryType::Document]);
    Document::factory()->published()->create(['category_id' => $category->id]);
    Document::factory()->published()->create(['category_id' => null]);

    $this->get(route('documents.index', ['category_id' => $category->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 1)
        );
});

it('shows a published document detail page', function () {
    $document = Document::factory()->published()->public()->create();

    $this->get(route('documents.show', $document))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('public/documents/show')
            ->has('document.data')
        );
});

it('returns 404 for unpublished document', function () {
    $document = Document::factory()->unpublished()->create();

    $this->get(route('documents.show', $document))
        ->assertNotFound();
});

it('returns 404 for members-only document when guest', function () {
    $document = Document::factory()->published()->membersOnly()->create();

    $this->get(route('documents.show', $document))
        ->assertNotFound();
});

it('allows member to view members-only document', function () {
    $member = User::factory()->create();
    $document = Document::factory()->published()->membersOnly()->create();

    $this->actingAs($member)
        ->get(route('documents.show', $document))
        ->assertSuccessful();
});

it('returns 404 for admin-only document when member', function () {
    $member = User::factory()->create();
    $document = Document::factory()->published()->adminOnly()->create();

    $this->actingAs($member)
        ->get(route('documents.show', $document))
        ->assertNotFound();
});
