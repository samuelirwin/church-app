<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CategoryType;
use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePageRequest;
use App\Http\Resources\PageResource;
use App\Models\Category;
use App\Models\Form;
use App\Models\Page;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class PageController extends Controller
{
    use ReadsTableQuery;

    /**
     * Columns the pages table can be sorted by (sort key => database column).
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'title' => 'title',
        'layout' => 'layout',
        'status' => 'is_published',
    ];

    /**
     * Display a listing of pages.
     */
    public function index(Request $request): Response
    {
        $categoryIds = $this->listInput($request, 'category_id');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $pages = Page::query()
            ->with(['creator', 'category'])
            ->when($request->input('search'), function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($categoryIds, fn (Builder $query) => $query->whereIn('category_id', $categoryIds))
            ->when($sort, fn (Builder $query) => $query->orderBy(self::SORTABLE[$sort], $direction), fn (Builder $query) => $query->latest())
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'category_id' => $categoryIds,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Admin pages listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/pages/index', [
            'pages' => PageResource::collection($pages),
            'filters' => $filters,
            'categories' => Category::where('type', CategoryType::Page)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new page.
     */
    public function create(): Response
    {
        return Inertia::render('admin/pages/create', [
            'categories' => Category::where('type', CategoryType::Page)->orderBy('name')->get(['id', 'name']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
            'publishedForms' => Form::query()
                ->where('is_published', true)
                ->orderBy('title')
                ->get(['id', 'title', 'slug']),
        ]);
    }

    /**
     * Store a newly created page.
     */
    public function store(StorePageRequest $request): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $page = Page::create([
            ...$request->safe()->except(['tags', 'cover_images', 'section_images', 'remove_covers']),
            'created_by' => $request->user()->id,
        ]);

        if (! empty($tags)) {
            $page->syncTags($tags);
        }

        if ($request->hasFile('cover_images')) {
            foreach ($request->file('cover_images') as $image) {
                $page->addMedia($image)->toMediaCollection('cover');
            }
        }

        $libraryMediaIds = $request->input('library_media_ids', []);
        if (! empty($libraryMediaIds)) {
            foreach (Media::whereIn('id', $libraryMediaIds)->get() as $media) {
                $media->copy($page, 'cover');
            }
            Log::info('Library media copied to page', [
                'page_id' => $page->id,
                'media_ids' => $libraryMediaIds,
            ]);
        }

        if ($request->hasFile('section_images')) {
            $sections = $page->sections ?? [];

            foreach ($request->file('section_images') as $sectionId => $image) {
                $media = $page->addMedia($image)->toMediaCollection('section_images');

                foreach ($sections as &$section) {
                    if (($section['id'] ?? '') === $sectionId) {
                        $section['data']['url'] = $media->getUrl();
                        break;
                    }
                }
            }

            $page->update(['sections' => $sections]);
        }

        Log::info('Page created', [
            'page_id' => $page->id,
            'title' => $page->title,
            'layout' => $page->layout->value,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.pages.index')
            ->with('success', "Page \"{$page->title}\" created.");
    }

    /**
     * Show the form for editing the specified page.
     */
    public function edit(Page $page): Response
    {
        return Inertia::render('admin/pages/edit', [
            'page' => new PageResource($page->load(['creator', 'category', 'tags', 'media'])),
            'categories' => Category::where('type', CategoryType::Page)->orderBy('name')->get(['id', 'name']),
            'allTags' => Tag::query()->ordered()->pluck('name'),
            'publishedForms' => Form::query()
                ->where('is_published', true)
                ->orderBy('title')
                ->get(['id', 'title', 'slug']),
        ]);
    }

    /**
     * Update the specified page.
     */
    public function update(StorePageRequest $request, Page $page): RedirectResponse
    {
        $tags = $request->input('tags', []);

        $page->update($request->safe()->except(['tags', 'cover_images', 'section_images', 'remove_covers']));

        $page->syncTags($tags);

        // Remove specific cover images
        $removeCovers = $request->input('remove_covers', []);
        if (! empty($removeCovers)) {
            $page->media()
                ->where('collection_name', 'cover')
                ->whereIn('id', $removeCovers)
                ->each(fn ($media) => $media->delete());
        }

        // Add new cover images
        if ($request->hasFile('cover_images')) {
            foreach ($request->file('cover_images') as $image) {
                $page->addMedia($image)->toMediaCollection('cover');
            }
        }

        $libraryMediaIds = $request->input('library_media_ids', []);
        if (! empty($libraryMediaIds)) {
            foreach (Media::whereIn('id', $libraryMediaIds)->get() as $media) {
                $media->copy($page, 'cover');
            }
            Log::info('Library media copied to page', [
                'page_id' => $page->id,
                'media_ids' => $libraryMediaIds,
            ]);
        }

        if ($request->hasFile('section_images')) {
            $sections = $page->sections ?? [];

            foreach ($request->file('section_images') as $sectionId => $image) {
                $media = $page->addMedia($image)->toMediaCollection('section_images');

                foreach ($sections as &$section) {
                    if (($section['id'] ?? '') === $sectionId) {
                        $section['data']['url'] = $media->getUrl();
                        break;
                    }
                }
            }

            $page->update(['sections' => $sections]);
        }

        Log::info('Page updated', [
            'page_id' => $page->id,
            'title' => $page->title,
            'layout' => $page->layout->value,
            'updated_by' => $request->user()->id,
        ]);

        $redirect = $request->input('_redirect') === 'stay'
            ? redirect()->route('admin.pages.edit', $page)
            : redirect()->route('admin.pages.index');

        return $redirect->with('success', "Page \"{$page->title}\" updated.");
    }

    /**
     * Remove the specified page.
     */
    public function destroy(Page $page): RedirectResponse
    {
        $title = $page->title;
        $pageId = $page->id;

        $page->delete();

        Log::info('Page deleted', [
            'page_id' => $pageId,
            'title' => $title,
        ]);

        return redirect()->route('admin.pages.index')
            ->with('success', "Page \"{$title}\" deleted.");
    }
}
