<?php

namespace App\Http\Controllers\Admin;

use App\Enums\HouseholdRole;
use App\Http\Controllers\Concerns\ReadsTableQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreHouseholdMemberRequest;
use App\Http\Requests\Admin\StoreHouseholdRequest;
use App\Http\Resources\HouseholdResource;
use App\Models\Household;
use App\Models\Member;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Households group members who live together (families). Staff and above only.
 */
class HouseholdController extends Controller
{
    use ReadsTableQuery;

    /**
     * Sortable columns for the households table; the default is alphabetical.
     *
     * @var array<string, string>
     */
    private const SORTABLE = [
        'name' => 'name',
        'people' => 'members_count',
        'city' => 'city',
    ];

    public function index(Request $request): Response
    {
        [$sort, $direction] = $this->sortInput($request, self::SORTABLE);

        $households = Household::query()
            ->with(['head', 'members' => fn ($q) => $q->with('media')->orderBy('date_of_birth')])
            ->withCount('members')
            ->when($request->input('search'), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->when($sort, fn ($q) => $q->orderBy(self::SORTABLE[$sort], $direction))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString();

        $filters = [
            'search' => $request->input('search'),
            'sort' => $sort,
            'direction' => $sort ? $direction : null,
        ];

        Log::info('Households listing viewed', ['user_id' => $request->user()->id, 'filters' => $filters]);

        return Inertia::render('admin/households/index', [
            'households' => HouseholdResource::collection($households),
            'filters' => $filters,
        ]);
    }

    public function store(StoreHouseholdRequest $request): RedirectResponse
    {
        $household = Household::create($request->validated());

        Log::info('Household created', [
            'household_id' => $household->id,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.households.show', $household)
            ->with('success', "Household \"{$household->name}\" created.");
    }

    public function show(Household $household): Response
    {
        $household->load(['members' => fn ($q) => $q->orderBy('household_role')->orderBy('date_of_birth')]);

        return Inertia::render('admin/households/show', [
            'household' => new HouseholdResource($household),
            'availableMembers' => Member::query()
                ->whereNull('household_id')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name'])
                ->map(fn (Member $m) => ['id' => $m->id, 'full_name' => $m->full_name]),
            'householdRoles' => array_map(
                fn (HouseholdRole $role) => ['value' => $role->value, 'label' => $role->label()],
                HouseholdRole::cases(),
            ),
        ]);
    }

    public function update(StoreHouseholdRequest $request, Household $household): RedirectResponse
    {
        $household->update($request->validated());

        Log::info('Household updated', [
            'household_id' => $household->id,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', 'Household updated.');
    }

    /**
     * Delete a household. Its members stay in the directory, they just
     * become unassigned (the foreign key nulls out).
     */
    public function destroy(Request $request, Household $household): RedirectResponse
    {
        $name = $household->name;
        $householdId = $household->id;

        Member::withTrashed()->where('household_id', $householdId)->update(['household_id' => null, 'household_role' => null]);
        $household->delete();

        Log::info('Household deleted', [
            'household_id' => $householdId,
            'name' => $name,
            'deleted_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.households.index')
            ->with('success', "Household \"{$name}\" deleted.");
    }

    public function addMember(StoreHouseholdMemberRequest $request, Household $household): RedirectResponse
    {
        $member = Member::findOrFail($request->validated('member_id'));

        $member->update([
            'household_id' => $household->id,
            'household_role' => $request->validated('household_role'),
        ]);

        Log::info('Member added to household', [
            'household_id' => $household->id,
            'member_id' => $member->id,
            'role' => $request->validated('household_role'),
            'added_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', "{$member->full_name} added to the household.");
    }

    public function removeMember(Request $request, Household $household, Member $member): RedirectResponse
    {
        abort_unless($member->household_id === $household->id, 404);

        $member->update(['household_id' => null, 'household_role' => null]);

        Log::info('Member removed from household', [
            'household_id' => $household->id,
            'member_id' => $member->id,
            'removed_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', "{$member->full_name} removed from the household.");
    }
}
