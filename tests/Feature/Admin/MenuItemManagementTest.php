<?php

use App\Enums\MenuItemType;
use App\Models\MenuItem;
use App\Models\User;

it('denies member access to menu items index', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.menu-items.index'))
        ->assertForbidden();
});

it('redirects admin from menu items index to site settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.menu-items.index'))
        ->assertRedirect(route('admin.site-settings.edit'));
});

it('allows admin to view create form', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.menu-items.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/menu-items/create')
            ->has('parentOptions')
            ->has('availablePages')
            ->has('types')
            ->has('targets')
        );
});

it('creates an internal page menu item', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => 'Sermons',
            'type' => 'internal_page',
            'route' => '/sermons',
            'target' => '_self',
            'sort_order' => 1,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $this->assertDatabaseHas('menu_items', [
        'label' => 'Sermons',
        'type' => 'internal_page',
        'route' => '/sermons',
        'target' => '_self',
    ]);
});

it('creates a custom URL menu item', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => 'YouTube',
            'type' => 'custom_url',
            'url' => 'https://youtube.com/@church',
            'target' => '_blank',
            'sort_order' => 5,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $this->assertDatabaseHas('menu_items', [
        'label' => 'YouTube',
        'type' => 'custom_url',
        'url' => 'https://youtube.com/@church',
        'target' => '_blank',
    ]);
});

it('creates a child menu item', function () {
    $admin = User::factory()->admin()->create();
    $parent = MenuItem::factory()->create(['label' => 'About']);

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => 'Our Team',
            'type' => 'internal_page',
            'route' => '/updates',
            'target' => '_self',
            'parent_id' => $parent->id,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    $this->assertDatabaseHas('menu_items', [
        'label' => 'Our Team',
        'parent_id' => $parent->id,
    ]);
});

it('validates required label when creating', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => '',
            'type' => 'internal_page',
            'target' => '_self',
        ])
        ->assertSessionHasErrors(['label']);
});

it('validates url is required for custom url type', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => 'External',
            'type' => 'custom_url',
            'target' => '_self',
            'url' => '',
        ])
        ->assertSessionHasErrors(['url']);
});

it('validates route is required for internal page type', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => 'Internal',
            'type' => 'internal_page',
            'target' => '_self',
            'route' => '',
        ])
        ->assertSessionHasErrors(['route']);
});

it('validates invalid type enum', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => 'Test',
            'type' => 'invalid_type',
            'target' => '_self',
        ])
        ->assertSessionHasErrors(['type']);
});

it('allows admin to view edit form', function () {
    $admin = User::factory()->admin()->create();
    $menuItem = MenuItem::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.menu-items.edit', $menuItem))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/menu-items/edit')
            ->has('menuItem')
            ->has('parentOptions')
            ->has('availablePages')
        );
});

it('updates a menu item', function () {
    $admin = User::factory()->admin()->create();
    $menuItem = MenuItem::factory()->create(['label' => 'Old Label']);

    $this->actingAs($admin)
        ->put(route('admin.menu-items.update', $menuItem), [
            'label' => 'New Label',
            'type' => 'internal_page',
            'route' => '/events',
            'target' => '_self',
            'sort_order' => 3,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.site-settings.edit'));

    expect($menuItem->fresh())
        ->label->toBe('New Label')
        ->route->toBe('/events')
        ->sort_order->toBe(3)
        ->is_active->toBeFalse();
});

it('deletes a menu item', function () {
    $admin = User::factory()->admin()->create();
    $menuItem = MenuItem::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.menu-items.destroy', $menuItem))
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(MenuItem::find($menuItem->id))->toBeNull();
});

it('cascade deletes children when parent is deleted', function () {
    $admin = User::factory()->admin()->create();
    $parent = MenuItem::factory()->create(['label' => 'Parent']);
    $child = MenuItem::factory()->childOf($parent)->create(['label' => 'Child']);

    $this->actingAs($admin)
        ->delete(route('admin.menu-items.destroy', $parent))
        ->assertRedirect(route('admin.site-settings.edit'));

    expect(MenuItem::find($parent->id))->toBeNull();
    expect(MenuItem::find($child->id))->toBeNull();
});

it('enforces 2-level nesting limit on create', function () {
    $admin = User::factory()->admin()->create();
    $parent = MenuItem::factory()->create(['label' => 'Level 0']);
    $child = MenuItem::factory()->childOf($parent)->create(['label' => 'Level 1']);
    $grandchild = MenuItem::factory()->childOf($child)->create(['label' => 'Level 2']);

    $this->actingAs($admin)
        ->post(route('admin.menu-items.store'), [
            'label' => 'Too Deep',
            'type' => 'internal_page',
            'route' => '/sermons',
            'target' => '_self',
            'parent_id' => $grandchild->id,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertSessionHasErrors(['parent_id']);
});

it('enforces 2-level nesting limit on update', function () {
    $admin = User::factory()->admin()->create();
    $parent = MenuItem::factory()->create(['label' => 'Level 0']);
    $child = MenuItem::factory()->childOf($parent)->create(['label' => 'Level 1']);
    $grandchild = MenuItem::factory()->childOf($child)->create(['label' => 'Level 2']);
    $standalone = MenuItem::factory()->create(['label' => 'Standalone']);

    $this->actingAs($admin)
        ->put(route('admin.menu-items.update', $standalone), [
            'label' => 'Standalone',
            'type' => 'internal_page',
            'route' => '/sermons',
            'target' => '_self',
            'parent_id' => $grandchild->id,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertSessionHasErrors(['parent_id']);
});

it('prevents setting self as parent on update', function () {
    $admin = User::factory()->admin()->create();
    $menuItem = MenuItem::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.menu-items.update', $menuItem), [
            'label' => $menuItem->label,
            'type' => 'internal_page',
            'route' => '/sermons',
            'target' => '_self',
            'parent_id' => $menuItem->id,
            'sort_order' => 0,
            'is_active' => true,
        ])
        ->assertSessionHasErrors(['parent_id']);
});

it('resolves URL correctly for internal page', function () {
    $item = MenuItem::factory()->create([
        'type' => MenuItemType::InternalPage,
        'route' => '/sermons',
    ]);

    expect($item->resolvedUrl())->toBe('/sermons');
});

it('resolves URL correctly for custom url', function () {
    $item = MenuItem::factory()->customUrl()->create([
        'url' => 'https://example.com',
    ]);

    expect($item->resolvedUrl())->toBe('https://example.com');
});

it('filters active items with scope', function () {
    $baseActive = MenuItem::active()->count();

    MenuItem::factory()->create(['is_active' => true]);
    MenuItem::factory()->inactive()->create();

    expect(MenuItem::active()->count())->toBe($baseActive + 1);
});

it('filters top-level items with scope', function () {
    $baseTopLevel = MenuItem::topLevel()->count();

    $parent = MenuItem::factory()->create();
    MenuItem::factory()->childOf($parent)->create();

    expect(MenuItem::topLevel()->count())->toBe($baseTopLevel + 1);
});
