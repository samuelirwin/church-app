<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\RegisterVisitorRequest;
use App\Models\Visitor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class VisitorController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('public/visitors/register');
    }

    public function register(RegisterVisitorRequest $request): RedirectResponse
    {
        $visitor = Visitor::create($request->validated());

        Log::info('New visitor registered', [
            'visitor_id' => $visitor->id,
            'name' => $visitor->name,
        ]);

        return redirect()->route('visit')
            ->with('success', 'Thank you for visiting! We look forward to connecting with you.');
    }
}
