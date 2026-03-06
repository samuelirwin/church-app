<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMinistryRequest;
use App\Http\Resources\MinistryResource;
use App\Models\Ministry;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MinistryController extends Controller
{
    public function index(Request $request): Response
    {
        $ministries = Ministry::query()
            ->with('leader')
            ->withCount('groups')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('sort_order')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/ministries/index', [
            'ministries' => MinistryResource::collection($ministries),
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/ministries/create', [
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreMinistryRequest $request): RedirectResponse
    {
        $ministry = Ministry::create($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $ministry->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $sourceMedia->copy($ministry, 'cover');
            Log::info('Library media copied to ministry', [
                'ministry_id' => $ministry->id,
                'source_media_id' => $libraryMediaId,
            ]);
        }

        Log::info('Ministry created', [
            'ministry_id' => $ministry->id,
            'name' => $ministry->name,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.ministries.index')
            ->with('success', "Ministry \"{$ministry->name}\" created.");
    }

    public function edit(Ministry $ministry): Response
    {
        return Inertia::render('admin/ministries/edit', [
            'ministry' => new MinistryResource($ministry->load('leader')),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(StoreMinistryRequest $request, Ministry $ministry): RedirectResponse
    {
        $ministry->update($request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']));

        if ($request->hasFile('cover_image')) {
            $ministry->addMediaFromRequest('cover_image')
                ->toMediaCollection('cover');
        } elseif ($libraryMediaId = $request->input('library_media_id')) {
            $sourceMedia = Media::findOrFail($libraryMediaId);
            $ministry->clearMediaCollection('cover');
            $sourceMedia->copy($ministry, 'cover');
            Log::info('Library media copied to ministry', [
                'ministry_id' => $ministry->id,
                'source_media_id' => $libraryMediaId,
            ]);
        } elseif ($request->boolean('remove_cover')) {
            $ministry->clearMediaCollection('cover');
        }

        Log::info('Ministry updated', [
            'ministry_id' => $ministry->id,
            'name' => $ministry->name,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.ministries.index')
            ->with('success', "Ministry \"{$ministry->name}\" updated.");
    }

    public function destroy(Ministry $ministry): RedirectResponse
    {
        $name = $ministry->name;
        $ministryId = $ministry->id;

        $ministry->delete();

        Log::info('Ministry deleted', [
            'ministry_id' => $ministryId,
            'name' => $name,
        ]);

        return redirect()->route('admin.ministries.index')
            ->with('success', "Ministry \"{$name}\" deleted.");
    }

    public function members(Ministry $ministry): Response
    {
        $members = $ministry->ministryMembers()
            ->with('user')
            ->latest('joined_at')
            ->paginate(20);

        return Inertia::render('admin/ministries/members', [
            'ministry' => new MinistryResource($ministry),
            'members' => $members,
        ]);
    }
}
