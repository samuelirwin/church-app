<?php

use App\Enums\CategoryType;
use App\Models\Category;

it('auto-generates slug from name on creation', function () {
    $category = Category::factory()->create(['name' => 'Test Category', 'slug' => null]);

    expect($category->slug)->toBe('test-category');
});

it('has parent-child relationships', function () {
    $parent = Category::factory()->ofType(CategoryType::Sermon)->create();
    $child = Category::factory()->ofType(CategoryType::Sermon)->create(['parent_id' => $parent->id]);

    expect($parent->children)->toHaveCount(1)
        ->and($parent->children->first()->id)->toBe($child->id)
        ->and($child->parent->id)->toBe($parent->id);
});

it('casts type to CategoryType enum', function () {
    $category = Category::factory()->ofType(CategoryType::Sermon)->create();

    expect($category->type)->toBeInstanceOf(CategoryType::class)
        ->and($category->type)->toBe(CategoryType::Sermon);
});
