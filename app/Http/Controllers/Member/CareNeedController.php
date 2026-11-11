<?php

namespace App\Http\Controllers\Member;

use App\Enums\CareNeedPriority;
use App\Enums\CareNeedSource;
use App\Enums\CareNeedType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Member\StoreMyCareNeedRequest;
use App\Models\CareNeed;
use App\Models\Member;
use App\Services\CareNeedService;
use App\Services\MemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "My Care Needs": members ask the care team for help and see how their
 * requests are going. Staff notes on the timeline are not shown here.
 */
class CareNeedController extends Controller
{
    public function __construct(
        private CareNeedService $careNeedService,
        private MemberService $memberService,
    ) {}

    public function index(Request $request): Response
    {
        $member = $this->memberService->syncFromUser($request->user());

        $household = $member->household_id
            ? Member::query()->where('household_id', $member->household_id)->orderBy('date_of_birth')->get()
            : collect([$member]);

        $careNeeds = CareNeed::query()
            ->requestedBy($request->user())
            ->with('member')
            ->latest()
            ->get()
            ->map(fn (CareNeed $need) => [
                'id' => $need->id,
                'title' => $need->title,
                'type_label' => $need->type->label(),
                'status' => $need->status->value,
                'status_label' => $need->status->label(),
                'person_name' => $need->person_name,
                'share_on_prayer_wall' => $need->share_on_prayer_wall,
                'created_at' => $need->created_at,
            ]);

        return Inertia::render('member/care-needs/index', [
            'careNeeds' => $careNeeds,
            'household' => $household->map(fn (Member $m) => ['id' => $m->id, 'full_name' => $m->full_name, 'is_self' => $m->id === $member->id])->values(),
            'types' => array_map(fn (CareNeedType $t) => ['value' => $t->value, 'label' => $t->label()], CareNeedType::requestable()),
        ]);
    }

    public function store(StoreMyCareNeedRequest $request): RedirectResponse
    {
        $member = $this->memberService->syncFromUser($request->user());
        $data = $request->validated();
        $isConfidential = (bool) ($data['is_confidential'] ?? false);

        $this->careNeedService->create([
            'member_id' => $data['member_id'] ?? $member->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'priority' => CareNeedPriority::Normal,
            'source' => CareNeedSource::MemberRequest,
            'is_confidential' => $isConfidential,
            // A confidential request is never shown on the prayer wall, whatever was ticked.
            'share_on_prayer_wall' => ! $isConfidential && (bool) ($data['share_on_prayer_wall'] ?? false),
        ], $request->user());

        Log::info('Member submitted care request', ['user_id' => $request->user()->id, 'type' => $data['type']]);

        return redirect()->route('my-care-needs.index')
            ->with('success', 'Thank you. Your request has been sent to the care team.');
    }
}
