<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\MinistryGroupResource;
use App\Models\MinistryGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GroupFinderController extends Controller
{
    public function index(Request $request): Response
    {
        $groups = MinistryGroup::query()
            ->active()
            ->with('ministry', 'leader')
            ->withCount('groupMembers')
            ->when($request->input('meeting_day'), function ($query, $day) {
                $query->where('meeting_day', $day);
            })
            ->when($request->input('location'), function ($query, $location) {
                $query->where('meeting_location', 'like', "%{$location}%");
            })
            ->when($request->boolean('available_only'), function ($query) {
                $query->where(function ($q) {
                    $q->whereNull('max_members')
                        ->orWhereColumn(
                            'max_members',
                            '>',
                            \DB::raw('(SELECT COUNT(*) FROM group_members WHERE group_members.ministry_group_id = ministry_groups.id)')
                        );
                });
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/groups/finder', [
            'groups' => MinistryGroupResource::collection($groups),
            'filters' => $request->only(['meeting_day', 'location', 'available_only']),
        ]);
    }
}
