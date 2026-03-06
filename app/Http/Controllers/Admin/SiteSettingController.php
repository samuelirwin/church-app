<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteSettingsRequest;
use App\Models\HeroSlide;
use App\Models\MenuItem;
use App\Models\ServiceTime;
use App\Models\SiteSetting;
use App\Models\VolunteerRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingController extends Controller
{
    public function edit(): Response
    {
        $general = SiteSetting::getByGroup('general');
        $socialLinksJson = SiteSetting::getValue('social', 'links', '[]');

        $heroSlides = HeroSlide::query()
            ->orderBy('sort_order')
            ->latest()
            ->get()
            ->map(fn (HeroSlide $slide) => [
                'id' => $slide->id,
                'title' => $slide->title,
                'subtitle' => $slide->subtitle,
                'sort_order' => $slide->sort_order,
                'is_active' => $slide->is_active,
                'image_url' => $slide->getFirstMediaUrl('image'),
            ]);

        $volunteerRoles = VolunteerRole::query()
            ->with('ministry')
            ->orderBy('name')
            ->get();

        $menuItems = MenuItem::query()
            ->with('children')
            ->topLevel()
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get();

        $serviceTimes = ServiceTime::query()
            ->withCount('schedules')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $logoPath = SiteSetting::getValue('branding', 'logo_path');
        $logoUrl = $logoPath ? Storage::url($logoPath) : null;

        return Inertia::render('admin/site-settings/edit', [
            'general' => $general,
            'socialLinks' => json_decode($socialLinksJson, true) ?: [],
            'heroSlides' => $heroSlides,
            'volunteerRoles' => $volunteerRoles,
            'menuItems' => $menuItems,
            'serviceTimes' => $serviceTimes,
            'logoUrl' => $logoUrl,
        ]);
    }

    public function update(UpdateSiteSettingsRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $generalFields = ['church_name', 'tagline', 'address', 'phone', 'email', 'hero_tagline', 'hero_heading', 'hero_subheading'];

        foreach ($generalFields as $field) {
            SiteSetting::setValue('general', $field, $validated[$field] ?? null);
        }

        $socialLinks = $validated['social_links'] ?? [];
        SiteSetting::setValue('social', 'links', json_encode($socialLinks));

        $this->handleLogoUpload($request);

        Cache::forget('site_settings');

        Log::info('Site settings updated', [
            'updated_by' => $request->user()->id,
            'fields' => array_keys($validated),
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', 'Site settings updated.');
    }

    private function handleLogoUpload(UpdateSiteSettingsRequest $request): void
    {
        if ($request->boolean('remove_logo')) {
            $existingPath = SiteSetting::getValue('branding', 'logo_path');

            if ($existingPath) {
                Storage::disk('public')->delete($existingPath);
                Log::info('Site logo removed', ['path' => $existingPath]);
            }

            SiteSetting::setValue('branding', 'logo_path', null);

            return;
        }

        if ($request->hasFile('logo_image')) {
            $existingPath = SiteSetting::getValue('branding', 'logo_path');

            if ($existingPath) {
                Storage::disk('public')->delete($existingPath);
            }

            $path = $request->file('logo_image')->store('logos', 'public');

            SiteSetting::setValue('branding', 'logo_path', $path);

            Log::info('Site logo uploaded', ['path' => $path]);
        }
    }
}
