<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHeroSlideRequest;
use App\Models\HeroSlide;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class HeroSlideController extends Controller
{
    /**
     * Show the form for creating a new hero slide.
     */
    public function create(): Response
    {
        return Inertia::render('admin/hero-slides/create');
    }

    /**
     * Store a newly created hero slide.
     */
    public function store(StoreHeroSlideRequest $request): RedirectResponse
    {
        $slide = HeroSlide::create([
            'title' => $request->input('title'),
            'subtitle' => $request->input('subtitle'),
            'link_url' => $request->input('link_url'),
            'link_text' => $request->input('link_text'),
            'sort_order' => $request->input('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        if ($request->hasFile('image')) {
            $slide->addMediaFromRequest('image')
                ->toMediaCollection('image');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($slide, 'image');
            Log::info('Library media copied to hero slide', [
                'hero_slide_id' => $slide->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Hero slide created', [
            'hero_slide_id' => $slide->id,
            'title' => $slide->title,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', 'Hero slide created.');
    }

    /**
     * Show the form for editing the specified hero slide.
     */
    public function edit(HeroSlide $heroSlide): Response
    {
        return Inertia::render('admin/hero-slides/edit', [
            'slide' => [
                'id' => $heroSlide->id,
                'title' => $heroSlide->title,
                'subtitle' => $heroSlide->subtitle,
                'link_url' => $heroSlide->link_url,
                'link_text' => $heroSlide->link_text,
                'sort_order' => $heroSlide->sort_order,
                'is_active' => $heroSlide->is_active,
                'image_url' => $heroSlide->getFirstMediaUrl('image'),
            ],
        ]);
    }

    /**
     * Update the specified hero slide.
     */
    public function update(StoreHeroSlideRequest $request, HeroSlide $heroSlide): RedirectResponse
    {
        $heroSlide->update([
            'title' => $request->input('title'),
            'subtitle' => $request->input('subtitle'),
            'link_url' => $request->input('link_url'),
            'link_text' => $request->input('link_text'),
            'sort_order' => $request->input('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ]);

        if ($request->hasFile('image')) {
            $heroSlide->addMediaFromRequest('image')
                ->toMediaCollection('image');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $heroSlide->clearMediaCollection('image');
            $sourceMedia->copy($heroSlide, 'image');
            Log::info('Library media copied to hero slide', [
                'hero_slide_id' => $heroSlide->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_image')) {
            $heroSlide->clearMediaCollection('image');
        }

        Log::info('Hero slide updated', [
            'hero_slide_id' => $heroSlide->id,
            'title' => $heroSlide->title,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', 'Hero slide updated.');
    }

    /**
     * Remove the specified hero slide.
     */
    public function destroy(HeroSlide $heroSlide): RedirectResponse
    {
        $slideId = $heroSlide->id;
        $title = $heroSlide->title;

        $heroSlide->delete();

        Log::info('Hero slide deleted', [
            'hero_slide_id' => $slideId,
            'title' => $title,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', 'Hero slide deleted.');
    }
}
