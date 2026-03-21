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
    /**
     * Display a listing of ministries.
     * Leaders see only ministries they lead.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $ministries = Ministry::query()
            ->with('leader')
            ->withCount('groups')
            ->when(! $user->isStaffOrAbove(), function ($query) use ($user) {
                $query->where('leader_id', $user->id);
            })
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('sort_order')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/ministries/index', [
            'ministries' => MinistryResource::collection($ministries),
            'filters' => $request->only(['search']),
            'isStaffOrAbove' => $user->isStaffOrAbove(),
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    /**
     * Show the form for creating a new ministry.
     * Staff+ only.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        return Inertia::render('admin/ministries/create', [
            'users' => User::orderBy('name')->get(['id', 'name']),
            'isAdmin' => $request->user()->isAdmin(),
        ]);
    }

    /**
     * Store a newly created ministry.
     */
    public function store(StoreMinistryRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']);

        if (! $request->user()->isAdmin()) {
            unset($data['is_governance_body']);
        }

        $ministry = Ministry::create($data);

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

    /**
     * Show the form for editing the specified ministry.
     * Leaders can only edit ministries they lead.
     */
    public function edit(Request $request, Ministry $ministry): Response
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $ministry->leader_id === $user->id, 403);

        return Inertia::render('admin/ministries/edit', [
            'ministry' => new MinistryResource($ministry->load('leader')),
            'users' => User::orderBy('name')->get(['id', 'name']),
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    /**
     * Update the specified ministry.
     * Leaders can only update ministries they lead.
     */
    public function update(StoreMinistryRequest $request, Ministry $ministry): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $ministry->leader_id === $user->id, 403);

        $data = $request->safe()->except(['cover_image', 'remove_cover', 'library_media_id']);

        if (! $user->isAdmin()) {
            unset($data['is_governance_body']);
        }

        $ministry->update($data);

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

    /**
     * Remove the specified ministry.
     * Staff+ only.
     */
    public function destroy(Request $request, Ministry $ministry): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $name = $ministry->name;
        $ministryId = $ministry->id;

        $ministry->delete();

        Log::info('Ministry deleted', [
            'ministry_id' => $ministryId,
            'name' => $name,
            'deleted_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.ministries.index')
            ->with('success', "Ministry \"{$name}\" deleted.");
    }

    /**
     * Display members of a ministry.
     * Leaders can view members of their own ministries.
     */
    public function members(Request $request, Ministry $ministry): Response
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $ministry->leader_id === $user->id, 403);

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
