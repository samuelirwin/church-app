<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMinistryGroupRequest;
use App\Http\Resources\MinistryGroupResource;
use App\Models\Ministry;
use App\Models\MinistryGroup;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MinistryGroupController extends Controller
{
    /**
     * Display a listing of ministry groups.
     * Leaders see groups where they lead the group or the parent ministry.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $groups = MinistryGroup::query()
            ->with('ministry', 'leader')
            ->withCount('groupMembers')
            ->when(! $user->isStaffOrAbove(), function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('leader_id', $user->id)
                        ->orWhereHas('ministry', fn ($mq) => $mq->where('leader_id', $user->id));
                });
            })
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->input('ministry_id'), function ($query, $ministryId) {
                $query->where('ministry_id', $ministryId);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/ministry-groups/index', [
            'groups' => MinistryGroupResource::collection($groups),
            'filters' => $request->only(['search', 'ministry_id']),
            'ministries' => Ministry::orderBy('name')->get(['id', 'name']),
            'isStaffOrAbove' => $user->isStaffOrAbove(),
        ]);
    }

    /**
     * Show the form for creating a new ministry group.
     * Staff+ only.
     */
    public function create(Request $request): Response
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        return Inertia::render('admin/ministry-groups/create', [
            'ministries' => Ministry::orderBy('name')->get(['id', 'name']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created ministry group.
     */
    public function store(StoreMinistryGroupRequest $request): RedirectResponse
    {
        $group = MinistryGroup::create($request->validated());

        Log::info('Ministry group created', [
            'group_id' => $group->id,
            'name' => $group->name,
            'ministry_id' => $group->ministry_id,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.ministry-groups.index')
            ->with('success', "Group \"{$group->name}\" created.");
    }

    /**
     * Show the form for editing a ministry group.
     * Leaders can only edit groups they lead or that belong to their ministry.
     */
    public function edit(Request $request, MinistryGroup $ministryGroup): Response
    {
        $user = $request->user();
        abort_unless(
            $user->isStaffOrAbove()
            || $ministryGroup->leader_id === $user->id
            || ($ministryGroup->ministry && $ministryGroup->ministry->leader_id === $user->id),
            403,
        );

        return Inertia::render('admin/ministry-groups/edit', [
            'group' => new MinistryGroupResource($ministryGroup->load(['ministry', 'leader'])),
            'ministries' => Ministry::orderBy('name')->get(['id', 'name']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified ministry group.
     */
    public function update(StoreMinistryGroupRequest $request, MinistryGroup $ministryGroup): RedirectResponse
    {
        $user = $request->user();
        abort_unless(
            $user->isStaffOrAbove()
            || $ministryGroup->leader_id === $user->id
            || ($ministryGroup->ministry && $ministryGroup->ministry->leader_id === $user->id),
            403,
        );

        $ministryGroup->update($request->validated());

        Log::info('Ministry group updated', [
            'group_id' => $ministryGroup->id,
            'name' => $ministryGroup->name,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.ministry-groups.index')
            ->with('success', "Group \"{$ministryGroup->name}\" updated.");
    }

    /**
     * Remove the specified ministry group.
     * Staff+ only.
     */
    public function destroy(Request $request, MinistryGroup $ministryGroup): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $name = $ministryGroup->name;
        $groupId = $ministryGroup->id;

        $ministryGroup->delete();

        Log::info('Ministry group deleted', [
            'group_id' => $groupId,
            'name' => $name,
            'deleted_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.ministry-groups.index')
            ->with('success', "Group \"{$name}\" deleted.");
    }

    /**
     * Display members of a ministry group.
     */
    public function members(Request $request, MinistryGroup $ministryGroup): Response
    {
        $user = $request->user();
        abort_unless(
            $user->isStaffOrAbove()
            || $ministryGroup->leader_id === $user->id
            || ($ministryGroup->ministry && $ministryGroup->ministry->leader_id === $user->id),
            403,
        );

        $members = $ministryGroup->groupMembers()
            ->with('user')
            ->latest('joined_at')
            ->paginate(20);

        return Inertia::render('admin/ministry-groups/members', [
            'group' => new MinistryGroupResource($ministryGroup->load('ministry')),
            'members' => $members,
        ]);
    }
}
