<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\CareNeed;
use App\Services\CareNeedService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Members-only wall of prayer requests that people chose to share.
 * Only first names are shown, and confidential requests never appear.
 */
class PrayerWallController extends Controller
{
    public function __construct(private CareNeedService $careNeedService) {}

    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $requests = CareNeed::query()
            ->onPrayerWall()
            ->with('member')
            ->withCount('prayers')
            ->withExists(['prayers as prayed_by_me' => fn ($q) => $q->where('user_id', $userId)])
            ->latest()
            ->paginate(20);

        $requests->getCollection()->transform(fn (CareNeed $need) => [
            'id' => $need->id,
            'title' => $need->title,
            'description' => $need->description,
            'name' => $need->prayer_wall_name,
            'prayers_count' => $need->prayers_count,
            'prayed_by_me' => (bool) $need->prayed_by_me,
            'created_at' => $need->created_at,
        ]);

        return Inertia::render('member/prayer-wall', [
            'requests' => $requests,
            'daysShown' => CareNeed::PRAYER_WALL_DAYS,
        ]);
    }

    public function pray(Request $request, CareNeed $careNeed): RedirectResponse
    {
        abort_unless(CareNeed::query()->onPrayerWall()->whereKey($careNeed->id)->exists(), 404);

        $this->careNeedService->pray($careNeed, $request->user());

        return redirect()->back();
    }
}
