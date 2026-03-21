<?php

use App\Models\HeroSlide;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    SiteSetting::setValue('general', 'church_name', 'Test Church');
});

it('shows hero slides in site settings page', function () {
    $admin = User::factory()->admin()->create();
    $slide = HeroSlide::factory()->create(['title' => 'Test Slide']);

    $this->actingAs($admin)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/site-settings/edit')
            ->has('heroSlides', 1)
            ->where('heroSlides.0.title', 'Test Slide')
        );
});

it('shows the create hero slide form', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.hero-slides.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/hero-slides/create')
        );
});

it('creates a hero slide with image upload', function () {
    $admin = User::factory()->admin()->create();
    $image = UploadedFile::fake()->image('hero.jpg', 1920, 700);

    $this->actingAs($admin)
        ->post(route('admin.hero-slides.store'), [
            'image' => $image,
            'title' => 'Welcome to Our Church',
            'subtitle' => 'A place where faith grows',
            'link_url' => 'https://example.com/visit',
            'link_text' => 'Plan Your Visit',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $slide = HeroSlide::where('title', 'Welcome to Our Church')->first();
    expect($slide)->not->toBeNull();
    expect($slide->subtitle)->toBe('A place where faith grows');
    expect($slide->link_url)->toBe('https://example.com/visit');
    expect($slide->link_text)->toBe('Plan Your Visit');
    expect($slide->sort_order)->toBe(1);
    expect($slide->is_active)->toBeTrue();
    expect($slide->getFirstMediaUrl('image'))->not->toBeEmpty();
});

it('requires an image when creating a hero slide', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.hero-slides.store'), [
            'title' => 'Test Slide',
        ])
        ->assertSessionHasErrors('image');
});

it('validates image file type', function () {
    $admin = User::factory()->admin()->create();
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $this->actingAs($admin)
        ->post(route('admin.hero-slides.store'), [
            'image' => $file,
            'title' => 'Test Slide',
        ])
        ->assertSessionHasErrors('image');
});

it('validates image max size', function () {
    $admin = User::factory()->admin()->create();
    $image = UploadedFile::fake()->image('huge.jpg')->size(6000);

    $this->actingAs($admin)
        ->post(route('admin.hero-slides.store'), [
            'image' => $image,
            'title' => 'Test Slide',
        ])
        ->assertSessionHasErrors('image');
});

it('validates link_url must be a valid url', function () {
    $admin = User::factory()->admin()->create();
    $image = UploadedFile::fake()->image('hero.jpg', 1920, 700);

    $this->actingAs($admin)
        ->post(route('admin.hero-slides.store'), [
            'image' => $image,
            'link_url' => 'not-a-url',
        ])
        ->assertSessionHasErrors('link_url');
});

it('creates a hero slide with only an image (no title or subtitle)', function () {
    $admin = User::factory()->admin()->create();
    $image = UploadedFile::fake()->image('hero.jpg', 1920, 700);

    $this->actingAs($admin)
        ->post(route('admin.hero-slides.store'), [
            'image' => $image,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(HeroSlide::count())->toBe(1);
});

it('shows the edit hero slide form', function () {
    $admin = User::factory()->admin()->create();
    $slide = HeroSlide::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.hero-slides.edit', $slide))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/hero-slides/edit')
            ->has('slide')
            ->where('slide.id', $slide->id)
        );
});

it('updates a hero slide', function () {
    $admin = User::factory()->admin()->create();
    $slide = HeroSlide::factory()->create(['title' => 'Original Title']);

    $this->actingAs($admin)
        ->put(route('admin.hero-slides.update', $slide), [
            'title' => 'Updated Title',
            'subtitle' => 'New subtitle',
            'sort_order' => 5,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $slide->refresh();
    expect($slide->title)->toBe('Updated Title');
    expect($slide->subtitle)->toBe('New subtitle');
    expect($slide->sort_order)->toBe(5);
    expect($slide->is_active)->toBeFalse();
});

it('replaces the hero slide image on update', function () {
    $admin = User::factory()->admin()->create();
    $slide = HeroSlide::factory()->create();
    $slide->addMedia(UploadedFile::fake()->image('old.jpg', 800, 400))
        ->toMediaCollection('image');
    $originalMediaCount = $slide->getMedia('image')->count();

    $newImage = UploadedFile::fake()->image('new.jpg', 1920, 700);

    $this->actingAs($admin)
        ->put(route('admin.hero-slides.update', $slide), [
            'image' => $newImage,
            'title' => $slide->title,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $slide->refresh();
    expect($slide->getMedia('image')->count())->toBe($originalMediaCount);
    expect($slide->getFirstMediaUrl('image'))->not->toBeEmpty();
});

it('does not require image on update', function () {
    $admin = User::factory()->admin()->create();
    $slide = HeroSlide::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.hero-slides.update', $slide), [
            'title' => 'Updated Without Image',
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect($slide->fresh()->title)->toBe('Updated Without Image');
});

it('deletes a hero slide', function () {
    $admin = User::factory()->admin()->create();
    $slide = HeroSlide::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.hero-slides.destroy', $slide))
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(HeroSlide::find($slide->id))->toBeNull();
});

it('denies member from creating a hero slide', function () {
    $member = User::factory()->create();
    $image = UploadedFile::fake()->image('hero.jpg', 1920, 700);

    $this->actingAs($member)
        ->post(route('admin.hero-slides.store'), [
            'image' => $image,
            'title' => 'Test',
        ])
        ->assertForbidden();
});

it('includes heroSlides in welcome page props', function () {
    $slide = HeroSlide::factory()->create(['title' => 'Active Hero']);
    $slide->addMedia(UploadedFile::fake()->image('hero.jpg', 1920, 700))
        ->toMediaCollection('image');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('heroSlides')
            ->has('heroSlides', 1)
            ->where('heroSlides.0.title', 'Active Hero')
        );
});

it('excludes inactive slides from welcome page', function () {
    $active = HeroSlide::factory()->active()->create(['title' => 'Active Slide']);
    $active->addMedia(UploadedFile::fake()->image('active.jpg', 1920, 700))
        ->toMediaCollection('image');

    $inactive = HeroSlide::factory()->inactive()->create(['title' => 'Inactive Slide']);
    $inactive->addMedia(UploadedFile::fake()->image('inactive.jpg', 1920, 700))
        ->toMediaCollection('image');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('heroSlides', 1)
            ->where('heroSlides.0.title', 'Active Slide')
        );
});

it('excludes slides without images from welcome page', function () {
    HeroSlide::factory()->create(['title' => 'No Image Slide']);

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('heroSlides', 0)
        );
});

it('returns heroSlides ordered by sort_order on welcome page', function () {
    $second = HeroSlide::factory()->create(['title' => 'Second', 'sort_order' => 2]);
    $second->addMedia(UploadedFile::fake()->image('second.jpg', 1920, 700))
        ->toMediaCollection('image');

    $first = HeroSlide::factory()->create(['title' => 'First', 'sort_order' => 1]);
    $first->addMedia(UploadedFile::fake()->image('first.jpg', 1920, 700))
        ->toMediaCollection('image');

    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('heroSlides', 2)
            ->where('heroSlides.0.title', 'First')
            ->where('heroSlides.1.title', 'Second')
        );
});
