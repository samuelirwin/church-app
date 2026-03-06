<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\MinistryGroupResource;
use App\Http\Resources\MinistryResource;
use App\Models\Ministry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MinistryController extends Controller
{
    public function index(Request $request): Response
    {
        $ministries = Ministry::query()
            ->active()
            ->with('media')
            ->withCount('ministryMembers')
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('sort_order')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('public/ministries/index', [
            'ministries' => MinistryResource::collection($ministries),
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Ministry $ministry): Response
    {
        abort_unless($ministry->is_active, 404);

        $ministry->load(['media', 'leader']);

        $groups = $ministry->groups()
            ->active()
            ->withCount('groupMembers')
            ->get();

        return Inertia::render('public/ministries/show', [
            'ministry' => new MinistryResource($ministry),
            'groups' => MinistryGroupResource::collection($groups),
        ]);
    }
}
