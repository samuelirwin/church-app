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
    public function index(Request $request): Response
    {
        $groups = MinistryGroup::query()
            ->with('ministry', 'leader')
            ->withCount('groupMembers')
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
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/ministry-groups/create', [
            'ministries' => Ministry::orderBy('name')->get(['id', 'name']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

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

    public function edit(MinistryGroup $ministryGroup): Response
    {
        return Inertia::render('admin/ministry-groups/edit', [
            'group' => new MinistryGroupResource($ministryGroup->load(['ministry', 'leader'])),
            'ministries' => Ministry::orderBy('name')->get(['id', 'name']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(StoreMinistryGroupRequest $request, MinistryGroup $ministryGroup): RedirectResponse
    {
        $ministryGroup->update($request->validated());

        Log::info('Ministry group updated', [
            'group_id' => $ministryGroup->id,
            'name' => $ministryGroup->name,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.ministry-groups.index')
            ->with('success', "Group \"{$ministryGroup->name}\" updated.");
    }

    public function destroy(MinistryGroup $ministryGroup): RedirectResponse
    {
        $name = $ministryGroup->name;
        $groupId = $ministryGroup->id;

        $ministryGroup->delete();

        Log::info('Ministry group deleted', [
            'group_id' => $groupId,
            'name' => $name,
        ]);

        return redirect()->route('admin.ministry-groups.index')
            ->with('success', "Group \"{$name}\" deleted.");
    }

    public function members(MinistryGroup $ministryGroup): Response
    {
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
