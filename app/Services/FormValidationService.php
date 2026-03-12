<?php

namespace App\Services;

use App\Models\Form;

class FormValidationService
{
    /**
     * Build validation rules from form field definitions.
     *
     * @param  string  $prefix  The answer key prefix (e.g. 'answers' or 'form_answers')
     * @return array<string, array<string>>
     */
    public function buildValidationRules(Form $form, string $prefix = 'answers'): array
    {
        $rules = [$prefix => ['required', 'array']];

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

            $rules["{$prefix}.{$fieldId}"] = $fieldRules;
        }

        return $rules;
    }

    /**
     * Calculate the score for a form response based on field points.
     *
     * @param  array<string, mixed>  $answers
     */
    public function calculateScore(Form $form, array $answers): int
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

            $correctOptions = collect($field['options'] ?? [])
                ->filter(fn (array $opt) => ! empty($opt['correct']))
                ->pluck('value')
                ->all();

            if (empty($correctOptions)) {
                continue;
            }

            if (is_array($answer)) {
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
