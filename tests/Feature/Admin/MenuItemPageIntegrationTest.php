<?php

use App\Enums\MenuItemType;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\User;

it('creates a menu item linked to a page', function () {
    $staff = User::factory()->staff()->create();
    $page = Page::factory()->published()->create();

    $this->actingAs($staff)
        ->post(route('admin.menu-items.store'), [
            'label' => 'About Us',
            'type' => 'page',
            'page_id' => $page->id,
            'target' => '_self',
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $menuItem = MenuItem::where('label', 'About Us')->first();
    expect($menuItem->type)->toBe(MenuItemType::Page);
    expect($menuItem->page_id)->toBe($page->id);
});

it('validates page_id is required for page type menu items', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.menu-items.store'), [
            'label' => 'About',
            'type' => 'page',
            'target' => '_self',
        ])
        ->assertSessionHasErrors(['page_id']);
});

it('resolves URL for page type menu items', function () {
    $page = Page::factory()->published()->create(['slug' => 'about-us']);
    $menuItem = MenuItem::factory()->create([
        'type' => MenuItemType::Page,
        'page_id' => $page->id,
    ]);

    expect($menuItem->resolvedUrl())->toBe('/pages/about-us');
});

it('handles deleted page gracefully in menu item URL', function () {
    $page = Page::factory()->published()->create(['slug' => 'temp-page']);
    $menuItem = MenuItem::factory()->create([
        'type' => MenuItemType::Page,
        'page_id' => $page->id,
    ]);

    $page->delete();
    $menuItem->refresh();

    // page_id should be null due to nullOnDelete
    expect($menuItem->page_id)->toBeNull();
    expect($menuItem->resolvedUrl())->toBe('#');
});
