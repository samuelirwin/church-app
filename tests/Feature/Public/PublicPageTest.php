<?php

use App\Models\Form;
use App\Models\Page;

it('displays a published page', function () {
    $page = Page::factory()->published()->withSections()->create();

    $this->get("/{$page->slug}")
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('public/pages/show')
            ->has('page')
            ->has('embeddedForms')
        );
});

it('returns 404 for draft pages', function () {
    $page = Page::factory()->draft()->create();

    $this->get("/{$page->slug}")
        ->assertNotFound();
});

it('returns 404 for non-existent slugs', function () {
    $this->get('/nonexistent-page-slug')
        ->assertNotFound();
});

it('displays page sections correctly', function () {
    $page = Page::factory()->published()->withSections()->create();

    $this->get("/{$page->slug}")
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('public/pages/show')
            ->where('page.data.sections', fn ($sections) => count($sections) === 2)
        );
});

it('resolves embedded form data for form_embed sections', function () {
    $form = Form::factory()->create(['is_published' => true]);

    $page = Page::factory()->published()->create([
        'sections' => [
            [
                'id' => 'section_1',
                'type' => 'form_embed',
                'alignment' => 'full',
                'data' => ['form_id' => $form->id, 'heading' => 'Contact Us'],
            ],
        ],
    ]);

    $this->get("/{$page->slug}")
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('public/pages/show')
            ->has("embeddedForms.{$form->id}")
        );
});

it('does not resolve unpublished embedded forms', function () {
    $form = Form::factory()->create(['is_published' => false]);

    $page = Page::factory()->published()->create([
        'sections' => [
            [
                'id' => 'section_1',
                'type' => 'form_embed',
                'alignment' => 'full',
                'data' => ['form_id' => $form->id, 'heading' => ''],
            ],
        ],
    ]);

    $this->get("/{$page->slug}")
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('public/pages/show')
            ->missing("embeddedForms.{$form->id}")
        );
});

it('includes page_url in page data', function () {
    $page = Page::factory()->published()->create();

    $this->get("/{$page->slug}")
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('public/pages/show')
            ->has('pageUrl')
            ->has('page.data.page_url')
        );
});

it('redirects to external URL when redirect_url is set', function () {
    $page = Page::factory()->published()->redirect('https://example.com/external')->create();

    $this->get("/{$page->slug}")
        ->assertRedirect('https://example.com/external');
});

it('does not redirect when redirect_url is null', function () {
    $page = Page::factory()->published()->create(['redirect_url' => null]);

    $this->get("/{$page->slug}")
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p->component('public/pages/show'));
});

it('does not redirect draft pages with redirect_url', function () {
    $page = Page::factory()->draft()->redirect('https://example.com')->create();

    $this->get("/{$page->slug}")
        ->assertNotFound();
});

it('includes redirect_url in page resource data', function () {
    $page = Page::factory()->published()->redirect('https://example.com/link')->create();

    $this->get("/{$page->slug}")
        ->assertRedirect('https://example.com/link');
});

it('includes cover URLs and tags in page data', function () {
    $page = Page::factory()->published()->create();
    $page->syncTags(['about', 'faith']);

    $this->get("/{$page->slug}")
        ->assertSuccessful()
        ->assertInertia(fn ($p) => $p
            ->component('public/pages/show')
            ->has('page.data.cover_urls')
            ->has('page.data.tags')
        );
});
