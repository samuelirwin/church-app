<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\HighlightResource;
use App\Models\Highlight;
use Inertia\Inertia;
use Inertia\Response;

class HighlightController extends Controller
{
    /**
     * Display a listing of active highlights.
     */
    public function index(): Response
    {
        $highlights = Highlight::query()
            ->active()
            ->with(['author', 'media'])
            ->orderByDesc('priority')
            ->get();

        return Inertia::render('public/highlights/index', [
            'highlights' => HighlightResource::collection($highlights),
        ]);
    }
}
