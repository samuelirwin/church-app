<?php

use App\Enums\CategoryType;
use App\Enums\DocumentVisibility;
use App\Models\Category;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('denies member access to document listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.documents.index'))
        ->assertForbidden();
});

it('allows staff to view document listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.documents.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/documents/index')
            ->has('documents')
            ->has('filters')
            ->has('categories')
            ->has('visibilities')
        );
});

it('shows the create document page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.documents.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/documents/create')
            ->has('categories')
            ->has('visibilities')
            ->has('allTags')
        );
});

it('creates a document with valid data and file', function () {
    Storage::fake('public');
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.documents.store'), [
            'title' => 'Church Bulletin',
            'description' => '<p>Weekly bulletin for Sunday.</p>',
            'document_file' => UploadedFile::fake()->create('bulletin.pdf', 1024, 'application/pdf'),
            'visibility' => 'public',
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.documents.index'));

    $document = Document::where('title', 'Church Bulletin')->first();
    expect($document)->not->toBeNull()
        ->and($document->slug)->toBe('church-bulletin')
        ->and($document->visibility)->toBe(DocumentVisibility::Public)
        ->and($document->uploaded_by)->toBe($staff->id);
});

it('validates required fields when creating a document', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.documents.store'), [])
        ->assertSessionHasErrors(['title', 'document_file', 'visibility']);
});

it('validates file type and size', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.documents.store'), [
            'title' => 'Bad File',
            'document_file' => UploadedFile::fake()->create('malware.exe', 100, 'application/x-msdownload'),
            'visibility' => 'public',
        ])
        ->assertSessionHasErrors(['document_file']);
});

it('updates a document', function () {
    $staff = User::factory()->staff()->create();
    $document = Document::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.documents.update', $document), [
            'title' => 'Updated Title',
            'visibility' => 'members',
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.documents.index'));

    $document->refresh();
    expect($document->title)->toBe('Updated Title')
        ->and($document->visibility)->toBe(DocumentVisibility::Members);
});

it('deletes a document', function () {
    $staff = User::factory()->staff()->create();
    $document = Document::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.documents.destroy', $document))
        ->assertRedirect(route('admin.documents.index'));

    expect(Document::find($document->id))->toBeNull();
});

it('searches documents by title', function () {
    $staff = User::factory()->staff()->create();
    Document::factory()->create(['title' => 'Annual Report 2024']);
    Document::factory()->create(['title' => 'Weekly Bulletin']);

    $this->actingAs($staff)
        ->get(route('admin.documents.index', ['search' => 'Annual']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 1)
        );
});

it('filters documents by category', function () {
    $staff = User::factory()->staff()->create();
    $category = Category::factory()->create(['type' => CategoryType::Document]);
    Document::factory()->create(['category_id' => $category->id]);
    Document::factory()->create(['category_id' => null]);

    $this->actingAs($staff)
        ->get(route('admin.documents.index', ['category_id' => $category->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 1)
        );
});

it('filters documents by visibility', function () {
    $staff = User::factory()->staff()->create();
    Document::factory()->create(['visibility' => DocumentVisibility::Public]);
    Document::factory()->create(['visibility' => DocumentVisibility::Members]);
    Document::factory()->create(['visibility' => DocumentVisibility::Admin]);

    $this->actingAs($staff)
        ->get(route('admin.documents.index', ['visibility' => 'members']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 1)
        );
});

it('shows the edit document page', function () {
    $staff = User::factory()->staff()->create();
    $document = Document::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.documents.edit', $document))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/documents/edit')
            ->has('document.data')
            ->has('categories')
            ->has('visibilities')
            ->has('allTags')
        );
});

describe('data table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->staff()->create();
        Document::factory()->create(['title' => 'Alpha', 'created_at' => now()->subDay()]);
        Document::factory()->create(['title' => 'Omega', 'created_at' => now()->subDays(2)]);

        $this->actingAs($staff)->get(route('admin.documents.index', ['sort' => 'title', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('documents.data.0.title', 'Omega')->where('filters.sort', 'title'));

        $this->actingAs($staff)->get(route('admin.documents.index', ['sort' => 'file_path', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('documents.data.0.title', 'Alpha')->where('filters.sort', null));
    });

    it('filters by several visibilities and paginates', function () {
        $staff = User::factory()->staff()->create();
        Document::factory()->public()->create();
        Document::factory()->membersOnly()->create();
        Document::factory()->adminOnly()->create();

        $this->actingAs($staff)
            ->get(route('admin.documents.index', ['visibility' => [DocumentVisibility::Public->value, DocumentVisibility::Members->value]]))
            ->assertInertia(fn ($page) => $page
                ->has('documents.data', 2)
                ->where('filters.visibility', ['public', 'members'])
                ->where('documents.meta.total', 2)
                ->has('documents.meta.links'));
    });
});
