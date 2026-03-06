<?php

use App\Models\MenuItem;
use App\Models\ServiceTime;
use App\Models\SiteSetting;
use App\Models\User;
use App\Models\VolunteerRole;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    // Seed defaults so tests have a baseline
    SiteSetting::setValue('general', 'church_name', 'Test Church');
    SiteSetting::setValue('general', 'tagline', null);
    SiteSetting::setValue('general', 'address', null);
    SiteSetting::setValue('general', 'phone', null);
    SiteSetting::setValue('general', 'email', null);
    SiteSetting::setValue('social', 'links', '[]');
});

// Access control

it('denies member access to site settings', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.site-settings.edit'))
        ->assertForbidden();
});

it('allows staff to view site settings page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/site-settings/edit')
            ->has('general')
            ->has('socialLinks')
            ->has('heroSlides')
            ->has('volunteerRoles')
            ->has('menuItems')
            ->has('serviceTimes')
        );
});

it('denies staff access to update site settings', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'New Name',
        ])
        ->assertForbidden();
});

it('denies leader access to update site settings', function () {
    $leader = User::factory()->leader()->create();

    $this->actingAs($leader)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'New Name',
        ])
        ->assertForbidden();
});

it('allows admin to view site settings page', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/site-settings/edit')
            ->has('general')
            ->has('socialLinks')
        );
});

// General settings CRUD

it('updates general settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Grace Community Church',
            'tagline' => 'Growing in faith together',
            'address' => '123 Main St, Springfield',
            'phone' => '(555) 123-4567',
            'email' => 'info@gracechurch.org',
        ])
        ->assertRedirect(route('admin.site-settings.edit'))
        ->assertSessionHas('success');

    expect(SiteSetting::getValue('general', 'church_name'))->toBe('Grace Community Church');
    expect(SiteSetting::getValue('general', 'tagline'))->toBe('Growing in faith together');
    expect(SiteSetting::getValue('general', 'address'))->toBe('123 Main St, Springfield');
    expect(SiteSetting::getValue('general', 'phone'))->toBe('(555) 123-4567');
    expect(SiteSetting::getValue('general', 'email'))->toBe('info@gracechurch.org');
});

it('requires church name', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => '',
        ])
        ->assertSessionHasErrors(['church_name']);
});

it('validates email format', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'email' => 'not-an-email',
        ])
        ->assertSessionHasErrors(['email']);
});

it('allows nullable fields to be empty', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'tagline' => null,
            'address' => null,
            'phone' => null,
            'email' => null,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(SiteSetting::getValue('general', 'tagline'))->toBeNull();
    expect(SiteSetting::getValue('general', 'address'))->toBeNull();
});

// Hero section settings

it('updates hero section settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'hero_tagline' => 'Come worship with us',
            'hero_heading' => 'Faith & Community',
            'hero_subheading' => 'Growing together in Christ.',
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(SiteSetting::getValue('general', 'hero_tagline'))->toBe('Come worship with us');
    expect(SiteSetting::getValue('general', 'hero_heading'))->toBe('Faith & Community');
    expect(SiteSetting::getValue('general', 'hero_subheading'))->toBe('Growing together in Christ.');
});

it('allows hero fields to be empty', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'hero_tagline' => null,
            'hero_heading' => null,
            'hero_subheading' => null,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(SiteSetting::getValue('general', 'hero_tagline'))->toBeNull();
    expect(SiteSetting::getValue('general', 'hero_heading'))->toBeNull();
    expect(SiteSetting::getValue('general', 'hero_subheading'))->toBeNull();
});

// Social links

it('updates social links', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'social_links' => [
                ['platform' => 'Facebook', 'url' => 'https://facebook.com/church', 'icon' => 'facebook', 'sort_order' => 0],
                ['platform' => 'YouTube', 'url' => 'https://youtube.com/@church', 'icon' => 'youtube', 'sort_order' => 1],
            ],
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $links = json_decode(SiteSetting::getValue('social', 'links'), true);

    expect($links)->toHaveCount(2);
    expect($links[0]['platform'])->toBe('Facebook');
    expect($links[1]['url'])->toBe('https://youtube.com/@church');
});

it('allows empty social links', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'social_links' => [],
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $links = json_decode(SiteSetting::getValue('social', 'links'), true);
    expect($links)->toBeEmpty();
});

it('validates social link URL format', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'social_links' => [
                ['platform' => 'Facebook', 'url' => 'not-a-url', 'icon' => 'facebook', 'sort_order' => 0],
            ],
        ])
        ->assertSessionHasErrors(['social_links.0.url']);
});

it('validates social link required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'social_links' => [
                ['platform' => '', 'url' => '', 'icon' => '', 'sort_order' => 0],
            ],
        ])
        ->assertSessionHasErrors([
            'social_links.0.platform',
            'social_links.0.url',
            'social_links.0.icon',
        ]);
});

// Additional data props

it('includes volunteer roles in site settings page', function () {
    $staff = User::factory()->staff()->create();
    VolunteerRole::factory()->count(2)->create();

    $this->actingAs($staff)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('volunteerRoles', 2)
        );
});

it('includes menu items in site settings page', function () {
    $staff = User::factory()->staff()->create();
    MenuItem::factory()->count(3)->create();

    $expectedCount = MenuItem::whereNull('parent_id')->count();

    $this->actingAs($staff)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('menuItems', $expectedCount)
        );
});

it('includes service times in site settings page', function () {
    $staff = User::factory()->staff()->create();
    ServiceTime::factory()->count(2)->create();

    $expectedCount = ServiceTime::count();

    $this->actingAs($staff)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('serviceTimes', $expectedCount)
        );
});

// Model helpers

it('retrieves settings by group', function () {
    SiteSetting::setValue('general', 'church_name', 'My Church');
    SiteSetting::setValue('general', 'tagline', 'Welcome home');

    $settings = SiteSetting::getByGroup('general');

    expect($settings)->toHaveKey('church_name', 'My Church');
    expect($settings)->toHaveKey('tagline', 'Welcome home');
});

it('returns default when value not found', function () {
    $value = SiteSetting::getValue('general', 'nonexistent', 'default_value');
    expect($value)->toBe('default_value');
});

// Inertia middleware sharing

it('shares site settings globally via Inertia', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('siteSettings')
            ->has('serviceTimes')
        );
});

it('shares site settings on public pages', function () {
    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('siteSettings')
            ->has('serviceTimes')
        );
});

// Logging

it('logs when site settings are updated', function () {
    $admin = User::factory()->admin()->create();

    \Illuminate\Support\Facades\Log::shouldReceive('info')
        ->once()
        ->withArgs(function ($message) {
            return $message === 'Site settings updated';
        });

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Updated Church',
        ]);
});

// Logo management

it('uploads a site logo', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'logo_image' => UploadedFile::fake()->image('logo.png', 200, 200),
        ])
        ->assertRedirect(route('admin.site-settings.edit'))
        ->assertSessionHas('success');

    $path = SiteSetting::getValue('branding', 'logo_path');
    expect($path)->not->toBeNull();
    Storage::disk('public')->assertExists($path);
});

it('replaces an existing logo when uploading a new one', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $oldPath = UploadedFile::fake()->image('old.png')->store('logos', 'public');
    SiteSetting::setValue('branding', 'logo_path', $oldPath);

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'logo_image' => UploadedFile::fake()->image('new.png', 200, 200),
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $newPath = SiteSetting::getValue('branding', 'logo_path');
    expect($newPath)->not->toBe($oldPath);
    Storage::disk('public')->assertExists($newPath);
    Storage::disk('public')->assertMissing($oldPath);
});

it('removes the site logo', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $path = UploadedFile::fake()->image('logo.png')->store('logos', 'public');
    SiteSetting::setValue('branding', 'logo_path', $path);

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'remove_logo' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(SiteSetting::getValue('branding', 'logo_path'))->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

it('validates logo file type', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'logo_image' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors(['logo_image']);
});

it('validates logo file size', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->put(route('admin.site-settings.update'), [
            'church_name' => 'Test Church',
            'logo_image' => UploadedFile::fake()->image('large.png')->size(3000),
        ])
        ->assertSessionHasErrors(['logo_image']);
});

it('passes logo url to site settings edit page', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();

    $path = UploadedFile::fake()->image('logo.png')->store('logos', 'public');
    SiteSetting::setValue('branding', 'logo_path', $path);

    $this->actingAs($admin)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/site-settings/edit')
            ->where('logoUrl', Storage::disk('public')->url($path))
        );
});

it('passes null logo url when no logo is set', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.site-settings.edit'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/site-settings/edit')
            ->where('logoUrl', null)
        );
});

it('shares logo url in site settings via Inertia globally', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $path = UploadedFile::fake()->image('logo.png')->store('logos', 'public');
    SiteSetting::setValue('branding', 'logo_path', $path);

    \Illuminate\Support\Facades\Cache::forget('site_settings');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('siteSettings.logoUrl')
        );
});
