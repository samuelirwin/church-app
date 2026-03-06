<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MinistryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'body' => $this->body,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'meeting_schedule' => $this->meeting_schedule,
            'meeting_location' => $this->meeting_location,
            'cover_url' => $this->getFirstMediaUrl('cover') ?: null,
            'leader' => $this->whenLoaded('leader', fn () => $this->leader ? [
                'id' => $this->leader->id,
                'name' => $this->leader->name,
            ] : null),
            'groups_count' => $this->whenCounted('groups'),
            'ministry_members_count' => $this->whenCounted('ministryMembers'),
            'created_at' => $this->created_at,
        ];
    }
}
