<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMenuItemRequest;
use App\Http\Requests\Admin\UpdateMenuItemRequest;
use App\Models\MenuItem;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('admin/menu-items/create', [
            'parentOptions' => $this->getParentOptions(),
            'availablePages' => config('menu.available_pages'),
            'publishedPages' => Page::published()->orderBy('title')->get(['id', 'title', 'slug']),
            'types' => $this->getEnumOptions(\App\Enums\MenuItemType::class),
            'targets' => $this->getEnumOptions(\App\Enums\MenuItemTarget::class),
        ]);
    }

    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if (! $this->isValidNestingDepth($validated['parent_id'] ?? null)) {
            return back()->withErrors(['parent_id' => 'Cannot nest more than 2 levels deep.'])->withInput();
        }

        $menuItem = MenuItem::create($validated);

        Log::info('Menu item created', [
            'menu_item_id' => $menuItem->id,
            'label' => $menuItem->label,
            'type' => $menuItem->type->value,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Menu item \"{$menuItem->label}\" created.");
    }

    public function edit(MenuItem $menuItem): Response
    {
        return Inertia::render('admin/menu-items/edit', [
            'menuItem' => $menuItem->load('page'),
            'parentOptions' => $this->getParentOptions($menuItem),
            'availablePages' => config('menu.available_pages'),
            'publishedPages' => Page::published()->orderBy('title')->get(['id', 'title', 'slug']),
            'types' => $this->getEnumOptions(\App\Enums\MenuItemType::class),
            'targets' => $this->getEnumOptions(\App\Enums\MenuItemTarget::class),
        ]);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): RedirectResponse
    {
        $validated = $request->validated();

        if (! $this->isValidNestingDepth($validated['parent_id'] ?? null, $menuItem)) {
            return back()->withErrors(['parent_id' => 'Cannot nest more than 2 levels deep.'])->withInput();
        }

        // Prevent setting self as parent
        if (isset($validated['parent_id']) && (int) $validated['parent_id'] === $menuItem->id) {
            return back()->withErrors(['parent_id' => 'A menu item cannot be its own parent.'])->withInput();
        }

        $menuItem->update($validated);

        Log::info('Menu item updated', [
            'menu_item_id' => $menuItem->id,
            'label' => $menuItem->label,
            'type' => $menuItem->type->value,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Menu item \"{$menuItem->label}\" updated.");
    }

    public function destroy(MenuItem $menuItem): RedirectResponse
    {
        $label = $menuItem->label;
        $menuItemId = $menuItem->id;

        $menuItem->delete();

        Log::info('Menu item deleted', [
            'menu_item_id' => $menuItemId,
            'label' => $label,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Menu item \"{$label}\" deleted.");
    }

    /**
     * Get valid parent options for the create/edit form.
     * Excludes the current item and its descendants to prevent circular nesting.
     * Only includes top-level and first-level items (not grandchildren).
     *
     * @return array<int, array{id: int, label: string, depth: int}>
     */
    private function getParentOptions(?MenuItem $exclude = null): array
    {
        $query = MenuItem::query()
            ->topLevel()
            ->with('children')
            ->orderBy('sort_order');

        $options = [];

        foreach ($query->get() as $item) {
            // Skip the item being edited and its children
            if ($exclude && $item->id === $exclude->id) {
                continue;
            }

            $options[] = ['id' => $item->id, 'label' => $item->label, 'depth' => 0];

            foreach ($item->children as $child) {
                if ($exclude && $child->id === $exclude->id) {
                    continue;
                }

                $options[] = ['id' => $child->id, 'label' => $child->label, 'depth' => 1];
            }
        }

        return $options;
    }

    /**
     * Verify nesting depth does not exceed 2 levels.
     * A top-level item has depth 0, child depth 1, grandchild depth 2.
     */
    private function isValidNestingDepth(?int $parentId, ?MenuItem $current = null): bool
    {
        if (! $parentId) {
            return true;
        }

        $parent = MenuItem::find($parentId);
        if (! $parent) {
            return false;
        }

        $parentDepth = $parent->depth();

        // New item would be parentDepth + 1
        $newDepth = $parentDepth + 1;
        if ($newDepth > 2) {
            return false;
        }

        // If moving an item that has children, check if children would exceed depth 2
        if ($current && $current->children()->exists()) {
            $maxChildDepth = $newDepth + 1;
            if ($maxChildDepth > 2) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function getEnumOptions(string $enumClass): array
    {
        return collect($enumClass::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->all();
    }
}
