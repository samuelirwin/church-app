<?php

namespace App\Http\Requests\Admin;

use App\Enums\ReviewRecommendation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBenevolentReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isStaffOrAbove() || $this->user()->isDeacon();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recommendation' => ['required', Rule::enum(ReviewRecommendation::class)],
            'amount_recommended' => ['nullable', 'numeric', 'min:0'],
            'comments' => ['nullable', 'string', 'max:5000'],
            'reviewed_at' => ['required', 'date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recommendation.required' => 'Please select a recommendation.',
            'reviewed_at.required' => 'The review date is required.',
        ];
    }
}
