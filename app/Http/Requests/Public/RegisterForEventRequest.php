<?php

namespace App\Http\Requests\Public;

use App\Services\FormValidationService;
use Illuminate\Foundation\Http\FormRequest;

class RegisterForEventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ];

        $event = $this->route('event');

        if ($event && $event->form_id && $event->registrationForm) {
            $formService = app(FormValidationService::class);
            $formRules = $formService->buildValidationRules($event->registrationForm, 'answers');
            $rules = array_merge($rules, $formRules);
        } else {
            $rules['answers'] = ['nullable', 'array'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Your name is required.',
            'email.required' => 'Your email address is required.',
            'email.email' => 'Please provide a valid email address.',
        ];
    }
}
