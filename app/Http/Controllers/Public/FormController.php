<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\FormResource;
use App\Models\Form;
use App\Notifications\FormResponseReceived;
use App\Services\FormValidationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
    public function __construct(
        private FormValidationService $formValidationService
    ) {}

    /**
     * Display a public form for submission.
     */
    public function show(Form $form): Response
    {
        abort_unless($form->is_published, 404);

        $user = auth()->user();
        $hasResponded = false;

        if ($user && $form->isOneResponsePerUser()) {
            $hasResponded = $form->responses()
                ->where('user_id', $user->id)
                ->exists();
        }

        return Inertia::render('public/forms/show', [
            'form' => new FormResource($form),
            'hasResponded' => $hasResponded,
        ]);
    }

    /**
     * Submit a response to a form.
     */
    public function submit(Request $request, Form $form): RedirectResponse
    {
        abort_unless($form->is_published, 404);

        if (! $form->isActive()) {
            return redirect()->back()
                ->with('error', 'This form is no longer accepting responses.');
        }

        if (! $form->allows_anonymous && ! auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        if ($user && $form->isOneResponsePerUser()) {
            $existing = $form->responses()
                ->where('user_id', $user->id)
                ->exists();

            if ($existing) {
                return redirect()->back()
                    ->with('error', 'You have already submitted a response to this form.');
            }
        }

        $rules = $this->formValidationService->buildValidationRules($form);
        $validated = $request->validate($rules);

        $score = null;
        if ($form->isScoringEnabled()) {
            $score = $this->formValidationService->calculateScore($form, $validated['answers'] ?? []);
        }

        $response = $form->responses()->create([
            'user_id' => $user?->id,
            'answers' => $validated['answers'] ?? [],
            'score' => $score,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'submitted_at' => now(),
        ]);

        if ($form->creator) {
            $form->creator->notify(new FormResponseReceived($form, $response));
        }

        Log::info('Form response submitted', [
            'form_id' => $form->id,
            'response_id' => $response->id,
            'user_id' => $user?->id,
            'score' => $score,
        ]);

        return redirect()->back()
            ->with('success', $form->getConfirmationMessage());
    }
}
