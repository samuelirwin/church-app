<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MinistryGroupResource extends JsonResource
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
            'is_active' => $this->is_active,
            'max_members' => $this->max_members,
            'meeting_day' => $this->meeting_day,
            'meeting_time' => $this->meeting_time,
            'meeting_location' => $this->meeting_location,
            'is_full' => $this->isFull(),
            'available_spots' => $this->availableSpots(),
            'ministry' => $this->whenLoaded('ministry', fn () => $this->ministry ? [
                'id' => $this->ministry->id,
                'name' => $this->ministry->name,
            ] : null),
            'leader' => $this->whenLoaded('leader', fn () => $this->leader ? [
                'id' => $this->leader->id,
                'name' => $this->leader->name,
            ] : null),
            'group_members_count' => $this->whenCounted('groupMembers'),
            'created_at' => $this->created_at,
        ];
    }
}
