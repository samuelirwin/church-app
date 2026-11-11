<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FollowUpStatus;
use App\Enums\FollowUpType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFollowUpRequest;
use App\Http\Requests\Admin\UpdateVisitorRequest;
use App\Models\User;
use App\Models\Visitor;
use App\Services\MemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class VisitorController extends Controller
{
    public function index(Request $request): Response
    {
        $visitors = Visitor::query()
            ->withCount('followUps')
            ->with('assignedUser')
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), function ($query, $status) {
                $query->where('follow_up_status', $status);
            })
            ->latest('first_visit_date')
            ->paginate(15)
            ->withQueryString();

        $user = $request->user();

        return Inertia::render('admin/visitors/index', [
            'visitors' => $visitors,
            'filters' => $request->only(['search', 'status']),
            'statuses' => collect(FollowUpStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'isStaffOrAbove' => $user->isStaffOrAbove(),
            'canConvert' => $user->isStaffOrAbove() || $user->isDeacon(),
        ]);
    }

    public function show(Request $request, Visitor $visitor): Response
    {
        $visitor->load(['followUps.user', 'assignedUser', 'convertedUser']);
        $user = $request->user();

        return Inertia::render('admin/visitors/show', [
            'visitor' => $visitor,
            'users' => User::orderBy('name')->get(['id', 'name']),
            'statuses' => collect(FollowUpStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'followUpTypes' => collect(FollowUpType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'isStaffOrAbove' => $user->isStaffOrAbove(),
            'canConvert' => $user->isStaffOrAbove() || $user->isDeacon(),
        ]);
    }

    /**
     * Update visitor details.
     * Staff+ only.
     */
    public function update(UpdateVisitorRequest $request, Visitor $visitor): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $visitor->update($request->validated());

        Log::info('Visitor updated', [
            'visitor_id' => $visitor->id,
            'status' => $visitor->follow_up_status->value,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Visitor information updated.');
    }

    /**
     * Delete a visitor.
     * Staff+ only.
     */
    public function destroy(Request $request, Visitor $visitor): RedirectResponse
    {
        abort_unless($request->user()->isStaffOrAbove(), 403);

        $name = $visitor->name;
        $visitorId = $visitor->id;

        $visitor->delete();

        Log::info('Visitor deleted', [
            'visitor_id' => $visitorId,
            'name' => $name,
            'deleted_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.visitors.index')
            ->with('success', "Visitor \"{$name}\" deleted.");
    }

    /**
     * Add a follow-up note for a visitor.
     * Leaders can add follow-ups.
     */
    public function addFollowUp(StoreFollowUpRequest $request, Visitor $visitor): RedirectResponse
    {
        $followUp = $visitor->followUps()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        Log::info('Follow-up added for visitor', [
            'visitor_id' => $visitor->id,
            'follow_up_id' => $followUp->id,
            'type' => $followUp->type->value,
            'added_by' => $request->user()->id,
        ]);

        return redirect()->back()
            ->with('success', 'Follow-up recorded.');
    }

    /**
     * Convert a visitor to a user account.
     * Staff+ or deacons can convert.
     */
    public function convert(Request $request, Visitor $visitor, MemberService $memberService): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->isStaffOrAbove() || $user->isDeacon(), 403);

        if (! $visitor->email) {
            return redirect()->back()
                ->with('error', 'Cannot convert visitor without an email address.');
        }

        if ($visitor->isConverted()) {
            return redirect()->back()
                ->with('info', 'This visitor has already been converted.');
        }

        $newUser = User::create([
            'name' => $visitor->name,
            'email' => $visitor->email,
            'password' => bcrypt(str()->random(32)),
        ]);

        $visitor->update([
            'converted_to_user_id' => $newUser->id,
            'follow_up_status' => FollowUpStatus::Connected,
        ]);

        $memberService->createFromVisitor($visitor, $newUser, $user);

        Password::sendResetLink(['email' => $newUser->email]);

        Log::info('Visitor converted to user', [
            'visitor_id' => $visitor->id,
            'user_id' => $newUser->id,
            'converted_by' => $user->id,
        ]);

        return redirect()->back()
            ->with('success', "Visitor \"{$visitor->name}\" converted to a member. A password reset email has been sent.");
    }
}
