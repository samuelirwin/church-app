<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookLendingResource;
use App\Models\BookLending;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookLendingController extends Controller
{
    /**
     * Display the user's current and past lendings.
     */
    public function index(Request $request): Response
    {
        $lendings = BookLending::query()
            ->where('user_id', $request->user()->id)
            ->with(['book', 'lender'])
            ->latest('borrowed_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('member/library/my-lendings', [
            'lendings' => BookLendingResource::collection($lendings),
        ]);
    }
}
