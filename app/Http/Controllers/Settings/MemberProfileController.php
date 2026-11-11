<?php

namespace App\Http\Controllers\Settings;

use App\Enums\Gender;
use App\Enums\MaritalStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\MemberProfileUpdateRequest;
use App\Http\Resources\MemberResource;
use App\Services\MemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lets a signed-in person keep their own directory details up to date.
 */
class MemberProfileController extends Controller
{
    public function __construct(private MemberService $memberService) {}

    public function edit(Request $request): Response
    {
        $member = $this->memberService->syncFromUser($request->user());
        $member->load('household.members');

        return Inertia::render('settings/member-profile', [
            'member' => new MemberResource($member),
            'household' => $member->household ? [
                'name' => $member->household->name,
                'members' => $member->household->members->map(fn ($m) => [
                    'id' => $m->id,
                    'full_name' => $m->full_name,
                    'role' => $m->household_role?->label(),
                ]),
            ] : null,
            'genders' => array_map(fn (Gender $g) => ['value' => $g->value, 'label' => $g->label()], Gender::cases()),
            'maritalStatuses' => array_map(fn (MaritalStatus $s) => ['value' => $s->value, 'label' => $s->label()], MaritalStatus::cases()),
        ]);
    }

    public function update(MemberProfileUpdateRequest $request): RedirectResponse
    {
        $member = $this->memberService->syncFromUser($request->user());
        $member->update($request->validated());

        Log::info('Member updated own profile', [
            'member_id' => $member->id,
            'user_id' => $request->user()->id,
            'changed_fields' => array_keys($member->getChanges()),
        ]);

        return to_route('member-profile.edit')->with('success', 'Your details have been updated.');
    }
}
