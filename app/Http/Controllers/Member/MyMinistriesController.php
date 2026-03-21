<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\GroupMember;
use App\Models\MinistryMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class MyMinistriesController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $ministries = MinistryMember::with(['ministry' => function ($q): void {
            $q->with(['leader:id,name', 'groups' => function ($g): void {
                $g->withCount('groupMembers');
            }]);
        }])
            ->where('user_id', $user->id)
            ->latest('joined_at')
            ->get()
            ->map(function (MinistryMember $m): array {
                $ministry = $m->ministry;

                return [
                    'id' => $m->id,
                    'ministry_id' => $ministry->id,
                    'name' => $ministry->name,
                    'slug' => $ministry->slug,
                    'description' => $ministry->description,
                    'role' => $m->role->label(),
                    'joined_at' => $m->joined_at->toDateString(),
                    'leader_name' => $ministry->leader?->name,
                    'meeting_schedule' => $ministry->meeting_schedule,
                    'meeting_location' => $ministry->meeting_location,
                    'cover_url' => $ministry->getFirstMediaUrl('cover') ?: null,
                    'group_count' => $ministry->groups->count(),
                ];
            });

        $groups = GroupMember::with(['group.ministry:id,name,slug'])
            ->where('user_id', $user->id)
            ->latest('joined_at')
            ->get()
            ->map(fn (GroupMember $g): array => [
                'id' => $g->id,
                'group_name' => $g->group->name,
                'ministry_name' => $g->group->ministry->name,
                'ministry_slug' => $g->group->ministry->slug,
                'joined_at' => $g->joined_at->toDateString(),
            ]);

        Log::info('My ministries viewed', [
            'user_id' => $user->id,
            'ministry_count' => $ministries->count(),
            'group_count' => $groups->count(),
        ]);

        return Inertia::render('member/ministries/index', [
            'ministries' => $ministries,
            'groups' => $groups,
        ]);
    }
}
