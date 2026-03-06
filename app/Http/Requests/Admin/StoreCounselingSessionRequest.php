<?php

namespace App\Http\Requests\Admin;

use App\Enums\SessionType;
use App\Http\Requests\Concerns\SanitizesHtml;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCounselingSessionRequest extends FormRequest
{
    use SanitizesHtml;

    /**
     * @return array<int, string>
     */
    protected function htmlFields(): array
    {
        return ['notes'];
    }

    public function authorize(): bool
    {
        return $this->user()->isStaffOrAbove();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'session_date' => ['required', 'date'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:480'],
            'session_type' => ['required', Rule::enum(SessionType::class)],
            'notes' => ['nullable', 'string'],
            'mood_rating' => ['nullable', 'integer', 'min:1', 'max:10'],
            'progress_notes' => ['nullable', 'string'],
            'next_session_date' => ['nullable', 'date', 'after:session_date'],
            'session_document' => ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,jpg,jpeg,png,gif,webp'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'session_date.required' => 'The session date is required.',
            'duration_minutes.required' => 'The session duration is required.',
            'duration_minutes.min' => 'The session must be at least 5 minutes.',
            'duration_minutes.max' => 'The session cannot exceed 480 minutes (8 hours).',
            'session_type.required' => 'Please select a session type.',
            'mood_rating.min' => 'Mood rating must be between 1 and 10.',
            'mood_rating.max' => 'Mood rating must be between 1 and 10.',
            'next_session_date.after' => 'Next session date must be after the current session date.',
        ];
    }
}
