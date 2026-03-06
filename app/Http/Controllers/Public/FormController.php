<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\FormResource;
use App\Models\Form;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class FormController extends Controller
{
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

        // Check if form is still active
        if (! $form->isActive()) {
            return redirect()->back()
                ->with('error', 'This form is no longer accepting responses.');
        }

        // Check anonymous access
        if (! $form->allows_anonymous && ! auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        // Check one response per user
        if ($user && $form->isOneResponsePerUser()) {
            $existing = $form->responses()
                ->where('user_id', $user->id)
                ->exists();

            if ($existing) {
                return redirect()->back()
                    ->with('error', 'You have already submitted a response to this form.');
            }
        }

        // Validate answers based on field definitions
        $rules = $this->buildValidationRules($form);
        $validated = $request->validate($rules);

        // Calculate score if scoring is enabled
        $score = null;
        if ($form->isScoringEnabled()) {
            $score = $this->calculateScore($form, $validated['answers'] ?? []);
        }

        $response = $form->responses()->create([
            'user_id' => $user?->id,
            'answers' => $validated['answers'] ?? [],
            'score' => $score,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'submitted_at' => now(),
        ]);

        Log::info('Form response submitted', [
            'form_id' => $form->id,
            'response_id' => $response->id,
            'user_id' => $user?->id,
            'score' => $score,
        ]);

        return redirect()->back()
            ->with('success', $form->getConfirmationMessage());
    }

    /**
     * Build validation rules from form field definitions.
     *
     * @return array<string, array<string>>
     */
    private function buildValidationRules(Form $form): array
    {
        $rules = ['answers' => ['required', 'array']];

        foreach ($form->fields ?? [] as $field) {
            $fieldId = $field['id'];
            $fieldRules = [];

            if (! empty($field['required'])) {
                $fieldRules[] = 'required';
            } else {
                $fieldRules[] = 'nullable';
            }

            match ($field['type']) {
                'email' => $fieldRules[] = 'email',
                'number', 'rating', 'scale' => $fieldRules[] = 'numeric',
                'date' => $fieldRules[] = 'date',
                'checkbox' => $fieldRules = array_merge($fieldRules, ['array']),
                default => $fieldRules[] = 'string',
            };

            $rules["answers.{$fieldId}"] = $fieldRules;
        }

        return $rules;
    }

    /**
     * Calculate the score for a form response based on field points.
     */
    private function calculateScore(Form $form, array $answers): int
    {
        $totalPoints = $form->totalPoints();
        if ($totalPoints === 0) {
            return 0;
        }

        $earnedPoints = 0;

        foreach ($form->fields ?? [] as $field) {
            $points = $field['points'] ?? 0;
            if ($points <= 0) {
                continue;
            }

            $fieldId = $field['id'];
            $answer = $answers[$fieldId] ?? null;

            // Check correct answer from options
            $correctOptions = collect($field['options'] ?? [])
                ->filter(fn (array $opt) => ! empty($opt['correct']))
                ->pluck('value')
                ->all();

            if (empty($correctOptions)) {
                continue;
            }

            if (is_array($answer)) {
                // Multi-select: all correct options must be selected
                if (count(array_diff($correctOptions, $answer)) === 0 && count(array_diff($answer, $correctOptions)) === 0) {
                    $earnedPoints += $points;
                }
            } elseif (in_array($answer, $correctOptions, true)) {
                $earnedPoints += $points;
            }
        }

        return (int) round(($earnedPoints / $totalPoints) * 100);
    }
}
