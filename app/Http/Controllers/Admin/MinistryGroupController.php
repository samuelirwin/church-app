<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ReadsTableQuery;
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
    use ReadsTableQuery;

    /**
     * Sortable columns for the groups table (key => column).
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'name' => 'name',
        'members' => 'group_members_count',
        'status' => 'is_active',
    ];

    /**
     * Sortable columns for a group's members table.
     *
     * @var array<string, string>
     */
    private const MEMBER_SORTABLE = [
        'name' => 'users.name',
        'joined_at' => 'group_members.joined_at',
    ];

    /**
     * Groups list. Leaders see groups they lead or groups in ministries they lead.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $ministryIds = $this->listInput($request, 'ministry_id');
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

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
            ->when($ministryIds, fn ($query) => $query->whereIn('ministry_id', $ministryIds))
            ->when($sort, fn ($query) => $query->orderBy(self::SORTABLE[$sort], $direction), fn ($query) => $query->latest())
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $filters = [
            ...$request->only(['search']),
            'ministry_id' => $ministryIds,
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Admin ministry groups listing viewed', ['user_id' => $user->id, 'filters' => $filters]);

        return Inertia::render('admin/ministry-groups/index', [
            'groups' => MinistryGroupResource::collection($groups),
            'filters' => $filters,
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

    public function members(Request $request, MinistryGroup $ministryGroup): Response
    {
        $user = $request->user();
        abort_unless(
            $user->isStaffOrAbove()
            || $ministryGroup->leader_id === $user->id
            || ($ministryGroup->ministry && $ministryGroup->ministry->leader_id === $user->id),
            403,
        );

        [$sort, $direction] = $this->sortInput($request, self::MEMBER_SORTABLE);

        // Joined to users so the table can sort by member name.
        $members = $ministryGroup->groupMembers()
            ->select('group_members.*')
            ->join('users', 'users.id', '=', 'group_members.user_id')
            ->with('user')
            ->when($sort, fn ($query) => $query->orderBy(self::MEMBER_SORTABLE[$sort], $direction), fn ($query) => $query->latest('group_members.joined_at'))
            ->orderByDesc('group_members.id')
            ->paginate(20)
            ->withQueryString();

        $filters = ['sort' => $sort, 'direction' => $sort ? $direction : null];

        Log::info('Ministry group members viewed', ['group_id' => $ministryGroup->id, 'user_id' => $user->id, 'filters' => $filters]);

        return Inertia::render('admin/ministry-groups/members', [
            'group' => new MinistryGroupResource($ministryGroup->load('ministry')),
            'members' => $members,
            'filters' => $filters,
        ]);
    }
}
