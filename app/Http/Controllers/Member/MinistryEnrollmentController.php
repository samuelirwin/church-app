<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\GroupMember;
use App\Models\Ministry;
use App\Models\MinistryGroup;
use App\Models\MinistryMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MinistryEnrollmentController extends Controller
{
    public function joinMinistry(Request $request, Ministry $ministry): RedirectResponse
    {
        $user = $request->user();

        $existing = MinistryMember::where('user_id', $user->id)
            ->where('ministry_id', $ministry->id)
            ->first();

        if ($existing) {
            return redirect()->back()
                ->with('info', 'You are already a member of this ministry.');
        }

        MinistryMember::create([
            'user_id' => $user->id,
            'ministry_id' => $ministry->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

        Log::info('User joined ministry', [
            'user_id' => $user->id,
            'ministry_id' => $ministry->id,
        ]);

        return redirect()->back()
            ->with('success', "You have joined {$ministry->name}.");
    }

    public function leaveMinistry(Request $request, Ministry $ministry): RedirectResponse
    {
        $user = $request->user();

        $membership = MinistryMember::where('user_id', $user->id)
            ->where('ministry_id', $ministry->id)
            ->first();

        if (! $membership) {
            return redirect()->back()
                ->with('error', 'You are not a member of this ministry.');
        }

        $membership->delete();

        Log::info('User left ministry', [
            'user_id' => $user->id,
            'ministry_id' => $ministry->id,
        ]);

        return redirect()->back()
            ->with('success', "You have left {$ministry->name}.");
    }

    public function joinGroup(Request $request, MinistryGroup $ministryGroup): RedirectResponse
    {
        $user = $request->user();

        $existing = GroupMember::where('user_id', $user->id)
            ->where('ministry_group_id', $ministryGroup->id)
            ->first();

        if ($existing) {
            return redirect()->back()
                ->with('info', 'You are already a member of this group.');
        }

        if ($ministryGroup->isFull()) {
            return redirect()->back()
                ->with('error', 'This group is full.');
        }

        GroupMember::create([
            'user_id' => $user->id,
            'ministry_group_id' => $ministryGroup->id,
            'joined_at' => now(),
        ]);

        Log::info('User joined ministry group', [
            'user_id' => $user->id,
            'group_id' => $ministryGroup->id,
        ]);

        return redirect()->back()
            ->with('success', "You have joined {$ministryGroup->name}.");
    }

    public function leaveGroup(Request $request, MinistryGroup $ministryGroup): RedirectResponse
    {
        $user = $request->user();

        $membership = GroupMember::where('user_id', $user->id)
            ->where('ministry_group_id', $ministryGroup->id)
            ->first();

        if (! $membership) {
            return redirect()->back()
                ->with('error', 'You are not a member of this group.');
        }

        $membership->delete();

        Log::info('User left ministry group', [
            'user_id' => $user->id,
            'group_id' => $ministryGroup->id,
        ]);

        return redirect()->back()
            ->with('success', "You have left {$ministryGroup->name}.");
    }
}
