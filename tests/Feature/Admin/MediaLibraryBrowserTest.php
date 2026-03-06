<?php

use App\Models\Page;
use App\Models\Speaker;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

beforeEach(function () {
    Storage::fake('public');
});

it('denies unauthenticated access to media library', function () {
    $this->getJson(route('admin.media-library.index'))
        ->assertUnauthorized();
});

it('denies member access to media library', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->getJson(route('admin.media-library.index'))
        ->assertForbidden();
});

it('allows staff to browse media library', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();
    $speaker->addMedia(UploadedFile::fake()->image('photo.jpg'))
        ->toMediaCollection('photo');

    $this->actingAs($staff)
        ->getJson(route('admin.media-library.index'))
        ->assertOk()
        ->assertJsonStructure([
            'data' => [['id', 'name', 'file_name', 'mime_type', 'size', 'url', 'collection_name', 'model_type', 'created_at']],
            'current_page',
            'last_page',
            'per_page',
            'total',
        ])
        ->assertJsonPath('total', 1);
});

it('searches media by file name', function () {
    $staff = User::factory()->staff()->create();
    $page = Page::factory()->create();

    $page->addMedia(UploadedFile::fake()->image('banner.jpg'))
        ->toMediaCollection('cover');
    $page->addMedia(UploadedFile::fake()->image('icon.png'))
        ->toMediaCollection('cover');

    $this->actingAs($staff)
        ->getJson(route('admin.media-library.index', ['search' => 'banner']))
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.file_name', 'banner.jpg');
});

it('filters media by mime type', function () {
    $staff = User::factory()->staff()->create();
    $page = Page::factory()->create();

    $page->addMedia(UploadedFile::fake()->image('photo.jpg'))
        ->toMediaCollection('cover');

    // Insert a non-image media record directly to test mime filtering
    Media::create([
        'model_type' => Page::class,
        'model_id' => $page->id,
        'uuid' => (string) \Illuminate\Support\Str::uuid(),
        'collection_name' => 'documents',
        'name' => 'doc',
        'file_name' => 'doc.pdf',
        'mime_type' => 'application/pdf',
        'disk' => 'public',
        'size' => 1024,
        'manipulations' => [],
        'custom_properties' => [],
        'generated_conversions' => [],
        'responsive_images' => [],
    ]);

    $this->actingAs($staff)
        ->getJson(route('admin.media-library.index', ['mime_filter' => 'image/']))
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.mime_type', 'image/jpeg');
});

it('paginates media results', function () {
    $staff = User::factory()->staff()->create();
    $page = Page::factory()->create();

    for ($i = 0; $i < 30; $i++) {
        $page->addMedia(UploadedFile::fake()->image("img_{$i}.jpg"))
            ->toMediaCollection('cover');
    }

    $response = $this->actingAs($staff)
        ->getJson(route('admin.media-library.index'))
        ->assertOk();

    $response->assertJsonPath('current_page', 1);
    $response->assertJsonPath('per_page', 24);
    $response->assertJsonPath('total', 30);
    expect($response->json('data'))->toHaveCount(24);

    // Page 2
    $this->actingAs($staff)
        ->getJson(route('admin.media-library.index', ['page' => 2]))
        ->assertOk()
        ->assertJsonPath('current_page', 2);
});

it('returns model type as class basename', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();

    $speaker->addMedia(UploadedFile::fake()->image('photo.jpg'))
        ->toMediaCollection('photo');

    $this->actingAs($staff)
        ->getJson(route('admin.media-library.index'))
        ->assertOk()
        ->assertJsonPath('data.0.model_type', 'Speaker');
});

it('copies library media to a page as cover images', function () {
    $staff = User::factory()->staff()->create();

    // Create a source media item on a speaker
    $speaker = Speaker::factory()->create();
    $speaker->addMedia(UploadedFile::fake()->image('source.jpg'))
        ->toMediaCollection('photo');
    $sourceMedia = $speaker->getFirstMedia('photo');

    $this->actingAs($staff)
        ->post(route('admin.pages.store'), [
            'title' => 'Page With Library Image',
            'layout' => 'full_width',
            'library_media_ids' => [$sourceMedia->id],
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Page With Library Image')->first();
    $coverMedia = $page->getMedia('cover');
    expect($coverMedia)->toHaveCount(1);
    expect($coverMedia->first()->file_name)->toBe('source.jpg');

    // Verify original media still exists on speaker
    $speaker->refresh();
    expect($speaker->getFirstMedia('photo'))->not->toBeNull();
});

it('copies library media to existing page on update', function () {
    $staff = User::factory()->staff()->create();
    $page = Page::factory()->create();

    $speaker = Speaker::factory()->create();
    $speaker->addMedia(UploadedFile::fake()->image('update-source.jpg'))
        ->toMediaCollection('photo');
    $sourceMedia = $speaker->getFirstMedia('photo');

    $this->actingAs($staff)
        ->put(route('admin.pages.update', $page), [
            'title' => $page->title,
            'layout' => $page->layout->value,
            'library_media_ids' => [$sourceMedia->id],
        ])
        ->assertRedirect();

    $page->refresh();
    $coverMedia = $page->getMedia('cover');
    expect($coverMedia)->toHaveCount(1);
});

it('validates library_media_ids must reference existing media', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.pages.store'), [
            'title' => 'Invalid Media',
            'layout' => 'full_width',
            'library_media_ids' => [99999],
        ])
        ->assertSessionHasErrors(['library_media_ids.0']);
});

it('orders media by newest first', function () {
    $staff = User::factory()->staff()->create();
    $page = Page::factory()->create();

    $page->addMedia(UploadedFile::fake()->image('first.jpg'))
        ->toMediaCollection('cover');

    $this->travel(1)->seconds();

    $page->addMedia(UploadedFile::fake()->image('second.jpg'))
        ->toMediaCollection('cover');

    $response = $this->actingAs($staff)
        ->getJson(route('admin.media-library.index'))
        ->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(2);
    expect($data[0]['file_name'])->toBe('second.jpg');
    expect($data[1]['file_name'])->toBe('first.jpg');
});
