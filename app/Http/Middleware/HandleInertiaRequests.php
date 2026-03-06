<?php

namespace App\Http\Middleware;

use App\Models\MenuItem;
use App\Models\ServiceTime;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => fn () => $this->getSiteSettings()['general']['church_name'] ?? config('app.name'),
            'auth' => [
                'user' => $request->user() ? array_merge(
                    $request->user()->toArray(),
                    ['avatar_url' => $request->user()->getFirstMediaUrl('avatar') ?: null]
                ) : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'navigation' => fn () => $this->getNavigation(),
            'siteSettings' => fn () => $this->getSiteSettings(),
            'serviceTimes' => fn () => $this->getServiceTimes(),
        ];
    }

    /**
     * Build the public navigation tree from cached menu items.
     *
     * @return array<int, array{id: int, label: string, url: string, target: string, children: array<int, array{id: int, label: string, url: string, target: string, children: array<mixed>}>}>
     */
    private function getNavigation(): array
    {
        return Cache::remember('public_navigation', 300, function () {
            return MenuItem::query()
                ->active()
                ->topLevel()
                ->with(['page', 'children' => function ($query) {
                    $query->active()->with(['page', 'children' => function ($q) {
                        $q->active()->with('page')->orderBy('sort_order');
                    }])->orderBy('sort_order');
                }])
                ->orderBy('sort_order')
                ->get()
                ->map(fn (MenuItem $item) => $this->transformMenuItem($item))
                ->all();
        });
    }

    /**
     * @return array{id: int, label: string, url: string, target: string, children: array<mixed>}
     */
    private function transformMenuItem(MenuItem $item): array
    {
        return [
            'id' => $item->id,
            'label' => $item->label,
            'url' => $item->resolvedUrl(),
            'target' => $item->target->value,
            'children' => $item->children->map(fn (MenuItem $child) => $this->transformMenuItem($child))->all(),
        ];
    }

    /**
     * @return array{general: array<string, string|null>, socialLinks: array<int, mixed>, logoUrl: string|null}
     */
    private function getSiteSettings(): array
    {
        return Cache::remember('site_settings', 300, function () {
            $general = SiteSetting::getByGroup('general');
            $socialLinksJson = SiteSetting::getValue('social', 'links', '[]');
            $logoPath = SiteSetting::getValue('branding', 'logo_path');

            return [
                'general' => $general,
                'socialLinks' => json_decode($socialLinksJson, true) ?: [],
                'logoUrl' => $logoPath ? Storage::url($logoPath) : null,
            ];
        });
    }

    /**
     * @return array<int, array{id: int, name: string, start_time: string|null, end_time: string|null}>
     */
    private function getServiceTimes(): array
    {
        return Cache::remember('public_service_times', 300, function () {
            return ServiceTime::active()
                ->orderBy('sort_order')
                ->get(['id', 'name', 'start_time', 'end_time'])
                ->toArray();
        });
    }
}
