<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'body' => $this->body,
            'location' => $this->location,
            'starts_at' => $this->starts_at?->toIso8601String(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'is_all_day' => $this->is_all_day,
            'recurrence' => $this->recurrence?->value,
            'recurrence_label' => $this->recurrence?->label(),
            'max_attendees' => $this->max_attendees,
            'is_published' => $this->is_published,
            'is_full' => $this->isFull(),
            'available_spots' => $this->availableSpots(),
            'cover_url' => $this->getFirstMediaUrl('cover') ?: null,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')),
            'form_id' => $this->form_id,
            'registration_form' => $this->whenLoaded('registrationForm', fn () => $this->registrationForm ? [
                'id' => $this->registrationForm->id,
                'title' => $this->registrationForm->title,
                'description' => $this->registrationForm->description,
                'fields' => $this->registrationForm->fields,
                'is_active' => $this->registrationForm->isActive(),
            ] : null),
            'registrations_count' => $this->whenCounted('registrations'),
            'created_at' => $this->created_at,
        ];
    }
}
