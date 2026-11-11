<?php

use App\Enums\PageLayout;
use App\Models\Category;
use App\Models\Page;
use App\Models\User;
use Illuminate\Http\UploadedFile;

it('denies member access to page listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.pages.index'))
        ->assertForbidden();
});

it('allows admin to view page listing', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.pages.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/pages/index')
            ->has('pages')
            ->has('filters')
            ->has('categories')
        );
});

it('shows the create page form', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.pages.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/pages/create')
            ->has('categories')
            ->has('allTags')
            ->has('publishedForms')
        );
});

it('creates a page with valid data', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'About Our Church',
            'layout' => 'full_width',
            'is_published' => true,
        ])
        ->assertRedirect(route('admin.pages.index'));

    expect(Page::where('title', 'About Our Church')->exists())->toBeTrue();
});

it('creates a page with sections', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Page With Sections',
            'layout' => 'full_width',
            'sections' => [
                [
                    'id' => 'section_1',
                    'type' => 'rich_text',
                    'alignment' => 'full',
                    'data' => ['content' => '<p>Hello world</p>'],
                ],
                [
                    'id' => 'section_2',
                    'type' => 'call_to_action',
                    'alignment' => 'center',
                    'data' => [
                        'heading' => 'Join Us',
                        'body' => '<p>Come worship with us.</p>',
                        'button_label' => 'Visit',
                        'button_url' => '/visit',
                    ],
                ],
            ],
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Page With Sections')->first();
    expect($page->sections)->toHaveCount(2);
});

it('creates a page with tags', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Tagged Page',
            'layout' => 'landing',
            'tags' => ['about', 'mission'],
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Tagged Page')->first();
    expect($page->tags)->toHaveCount(2);
});

it('validates required fields when creating a page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [])
        ->assertSessionHasErrors(['title', 'layout']);
});

it('validates section structure', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Bad Sections',
            'layout' => 'full_width',
            'sections' => [
                ['id' => 'x', 'type' => 'invalid_type', 'alignment' => 'full', 'data' => []],
            ],
        ])
        ->assertSessionHasErrors(['sections.0.type']);
});

it('auto-generates slug from title', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'What We Believe',
            'layout' => 'full_width',
        ]);

    $page = Page::where('title', 'What We Believe')->first();
    expect($page->slug)->toBe('what-we-believe');
});

it('shows the edit page form', function () {
    $admin = User::factory()->admin()->create();
    $page = Page::factory()->published()->create();

    $this->actingAs($admin)
        ->get(route('admin.pages.edit', $page))
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('admin/pages/edit')
            ->has('page')
            ->has('categories')
            ->has('allTags')
            ->has('publishedForms')
        );
});

it('updates a page', function () {
    $admin = User::factory()->admin()->create();
    $page = Page::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.pages.update', $page), [
            'title' => 'Updated Title',
            'layout' => 'sidebar_right',
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page->refresh();
    expect($page->title)->toBe('Updated Title');
    expect($page->layout)->toBe(PageLayout::SidebarRight);
});

it('deletes a page', function () {
    $admin = User::factory()->admin()->create();
    $page = Page::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.pages.destroy', $page))
        ->assertRedirect(route('admin.pages.index'));

    expect(Page::find($page->id))->toBeNull();
});

it('filters pages by search', function () {
    $admin = User::factory()->admin()->create();
    Page::factory()->create(['title' => 'About Us']);
    Page::factory()->create(['title' => 'Contact']);

    $this->actingAs($admin)
        ->get(route('admin.pages.index', ['search' => 'About']))
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('admin/pages/index')
            ->has('pages.data', 1)
        );
});

it('filters pages by category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::factory()->create(['type' => 'page']);
    Page::factory()->create(['category_id' => $category->id]);
    Page::factory()->create(['category_id' => null]);

    $this->actingAs($admin)
        ->get(route('admin.pages.index', ['category_id' => $category->id]))
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('admin/pages/index')
            ->has('pages.data', 1)
        );
});

it('validates layout enum values', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Bad Layout',
            'layout' => 'nonexistent_layout',
        ])
        ->assertSessionHasErrors(['layout']);
});

it('allows admin to manage pages', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.pages.index'))
        ->assertSuccessful();
});

it('creates a page with a category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::factory()->create(['type' => 'page']);

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Categorized Page',
            'layout' => 'full_width',
            'category_id' => $category->id,
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Categorized Page')->first();
    expect($page->category_id)->toBe($category->id);
});

it('uploads a section image when creating a page', function () {
    $admin = User::factory()->admin()->create();
    $sectionId = 'img-section-1';

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Page With Section Image',
            'layout' => 'full_width',
            'sections' => [
                [
                    'id' => $sectionId,
                    'type' => 'image',
                    'alignment' => 'full',
                    'data' => ['alt_text' => 'Church exterior', 'caption' => 'Our building'],
                ],
            ],
            'section_images' => [
                $sectionId => UploadedFile::fake()->image('church.jpg', 800, 600),
            ],
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Page With Section Image')->first();
    expect($page->sections[0]['data']['url'])->not->toBeEmpty();
    expect($page->getMedia('section_images'))->toHaveCount(1);
});

it('uploads a section image when updating a page', function () {
    $admin = User::factory()->admin()->create();
    $sectionId = 'img-section-update';
    $page = Page::factory()->create([
        'sections' => [
            [
                'id' => $sectionId,
                'type' => 'image',
                'alignment' => 'full',
                'data' => ['alt_text' => 'Old image', 'caption' => ''],
            ],
        ],
    ]);

    $this->actingAs($admin)
        ->put(route('admin.pages.update', $page), [
            'title' => $page->title,
            'layout' => $page->layout->value,
            'sections' => [
                [
                    'id' => $sectionId,
                    'type' => 'image',
                    'alignment' => 'full',
                    'data' => ['alt_text' => 'Updated image', 'caption' => 'New caption'],
                ],
            ],
            'section_images' => [
                $sectionId => UploadedFile::fake()->image('new-image.jpg', 640, 480),
            ],
        ])
        ->assertRedirect();

    $page->refresh();
    expect($page->sections[0]['data']['url'])->not->toBeEmpty();
    expect($page->sections[0]['data']['alt_text'])->toBe('Updated image');
    expect($page->getMedia('section_images'))->toHaveCount(1);
});

it('creates a page with a qr_code section using default page mode', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Page With QR Code',
            'layout' => 'full_width',
            'sections' => [
                [
                    'id' => 'qr-section-1',
                    'type' => 'qr_code',
                    'alignment' => 'center',
                    'data' => ['url_mode' => 'page', 'custom_url' => ''],
                ],
            ],
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Page With QR Code')->first();
    expect($page->sections)->toHaveCount(1);
    expect($page->sections[0]['type'])->toBe('qr_code');
    expect($page->sections[0]['data']['url_mode'])->toBe('page');
});

it('creates a page with a qr_code section using custom url', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Page With Custom QR',
            'layout' => 'full_width',
            'sections' => [
                [
                    'id' => 'qr-section-2',
                    'type' => 'qr_code',
                    'alignment' => 'center',
                    'data' => ['url_mode' => 'custom', 'custom_url' => 'https://example.com/register'],
                ],
            ],
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Page With Custom QR')->first();
    expect($page->sections[0]['data']['url_mode'])->toBe('custom');
    expect($page->sections[0]['data']['custom_url'])->toBe('https://example.com/register');
});

it('validates qr_code section rejects invalid custom url', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Bad QR URL',
            'layout' => 'full_width',
            'sections' => [
                [
                    'id' => 'qr-bad',
                    'type' => 'qr_code',
                    'alignment' => 'center',
                    'data' => ['url_mode' => 'custom', 'custom_url' => 'not-a-valid-url'],
                ],
            ],
        ])
        ->assertSessionHasErrors(['sections.0.data.custom_url']);
});

it('creates a page with a redirect URL', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'External Link Page',
            'layout' => 'full_width',
            'redirect_url' => 'https://example.com/external',
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'External Link Page')->first();
    expect($page->redirect_url)->toBe('https://example.com/external');
});

it('updates a page redirect URL', function () {
    $admin = User::factory()->admin()->create();
    $page = Page::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.pages.update', $page), [
            'title' => $page->title,
            'layout' => $page->layout->value,
            'redirect_url' => 'https://google.com',
        ])
        ->assertRedirect();

    $page->refresh();
    expect($page->redirect_url)->toBe('https://google.com');
});

it('clears redirect URL when set to empty', function () {
    $admin = User::factory()->admin()->create();
    $page = Page::factory()->redirect('https://example.com')->create();

    $this->actingAs($admin)
        ->put(route('admin.pages.update', $page), [
            'title' => $page->title,
            'layout' => $page->layout->value,
            'redirect_url' => '',
        ])
        ->assertRedirect();

    $page->refresh();
    expect($page->redirect_url)->toBeNull();
});

it('validates redirect URL format', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Bad Redirect',
            'layout' => 'full_width',
            'redirect_url' => 'not-a-url',
        ])
        ->assertSessionHasErrors(['redirect_url']);
});

it('includes redirect_url in page edit data', function () {
    $admin = User::factory()->admin()->create();
    $page = Page::factory()->redirect('https://example.com')->create();

    $this->actingAs($admin)
        ->get(route('admin.pages.edit', $page))
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('admin/pages/edit')
            ->where('page.data.redirect_url', 'https://example.com')
        );
});

it('preserves section url from library selection without file upload', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.pages.store'), [
            'title' => 'Library Image Page',
            'layout' => 'full_width',
            'sections' => [
                [
                    'id' => 'lib-section-1',
                    'type' => 'image',
                    'alignment' => 'center',
                    'data' => ['url' => 'https://example.com/photo.jpg', 'alt_text' => 'Photo', 'caption' => ''],
                ],
            ],
        ])
        ->assertRedirect(route('admin.pages.index'));

    $page = Page::where('title', 'Library Image Page')->first();
    expect($page->sections[0]['data']['url'])->toBe('https://example.com/photo.jpg');
});

describe('data table', function () {
    it('sorts by a whitelisted column and ignores unknown sorts', function () {
        $staff = User::factory()->admin()->create();
        Page::factory()->create(['title' => 'Alpha', 'created_at' => now()->subDay()]);
        Page::factory()->create(['title' => 'Omega', 'created_at' => now()->subDays(2)]);

        $this->actingAs($staff)->get(route('admin.pages.index', ['sort' => 'title', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('pages.data.0.title', 'Omega')->where('filters.sort', 'title'));

        $this->actingAs($staff)->get(route('admin.pages.index', ['sort' => 'sections', 'direction' => 'desc']))
            ->assertInertia(fn ($page) => $page->where('pages.data.0.title', 'Alpha')->where('filters.sort', null));
    });

    it('filters by several categories and paginates', function () {
        $admin = User::factory()->admin()->create();
        $about = Category::factory()->create(['type' => 'page']);
        $ministry = Category::factory()->create(['type' => 'page']);
        Page::factory()->create(['category_id' => $about->id]);
        Page::factory()->create(['category_id' => $ministry->id]);
        Page::factory()->create();

        $this->actingAs($admin)
            ->get(route('admin.pages.index', ['category_id' => [$about->id, $ministry->id]]))
            ->assertInertia(fn ($page) => $page
                ->has('pages.data', 2)
                ->where('filters.category_id', [(string) $about->id, (string) $ministry->id])
                ->where('pages.meta.total', 2)
                ->has('pages.meta.links'));
    });
});
