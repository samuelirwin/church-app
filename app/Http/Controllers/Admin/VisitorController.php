<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FollowUpStatus;
use App\Enums\FollowUpType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreFollowUpRequest;
use App\Http\Requests\Admin\UpdateVisitorRequest;
use App\Http\Resources\VisitorResource;
use App\Models\User;
use App\Models\Visitor;
use App\Services\MemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class VisitorController extends Controller
{
    /**
     * Visitor list with a split-view detail panel for the selected visitor.
     */
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
            'visitors' => VisitorResource::collection($visitors),
            'filters' => $request->only(['search', 'status', 'selected']),
            'statuses' => $this->statusOptions(),
            'isStaffOrAbove' => $user->isStaffOrAbove(),
            // Only this prop reloads when a row is clicked, so the list keeps its place.
            'selected' => fn () => $this->selectedDetail($request, $user),
        ]);
    }

    public function show(Request $request, Visitor $visitor): Response
    {
        return Inertia::render('admin/visitors/show', $this->detail($visitor, $request->user()));
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

    /**
     * Everything the visitor detail view needs, shared by the full page and the split panel.
     *
     * @return array<string, mixed>
     */
    private function detail(Visitor $visitor, User $user): array
    {
        $visitor->load(['followUps.user', 'assignedUser', 'convertedUser']);

        Log::info('Visitor viewed', ['visitor_id' => $visitor->id, 'user_id' => $user->id]);

        return [
            'visitor' => new VisitorResource($visitor),
            'users' => User::orderBy('name')->get(['id', 'name']),
            'statuses' => $this->statusOptions(),
            'followUpTypes' => collect(FollowUpType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'isStaffOrAbove' => $user->isStaffOrAbove(),
            'canConvert' => $user->isStaffOrAbove() || $user->isDeacon(),
        ];
    }

    /**
     * Detail for the visitor picked in the split view, or null when nothing is selected.
     *
     * @return array<string, mixed>|null
     */
    private function selectedDetail(Request $request, User $user): ?array
    {
        $visitor = Visitor::find($request->integer('selected'));

        return $visitor ? $this->detail($visitor, $user) : null;
    }

    /**
     * @return Collection<int, array{value: string, label: string}>
     */
    private function statusOptions(): Collection
    {
        return collect(FollowUpStatus::cases())->map(fn ($s) => [
            'value' => $s->value,
            'label' => $s->label(),
        ]);
    }
}
