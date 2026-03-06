<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'fields' => $this->fields,
            'settings' => $this->settings,
            'is_multi_step' => $this->is_multi_step,
            'is_published' => $this->is_published,
            'allows_anonymous' => $this->allows_anonymous,
            'expires_at' => $this->expires_at,
            'max_responses' => $this->max_responses,
            'notification_emails' => $this->notification_emails,
            'is_active' => $this->isActive(),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'responses_count' => $this->whenCounted('responses'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
