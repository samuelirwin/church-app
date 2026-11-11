<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HouseholdResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'address_line_1' => $this->address_line_1,
            'address_line_2' => $this->address_line_2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'notes' => $this->notes,
            'members_count' => $this->whenCounted('members'),
            'head' => $this->whenLoaded('head', fn () => $this->head ? [
                'id' => $this->head->id,
                'full_name' => $this->head->full_name,
            ] : null),
            'members' => MemberResource::collection($this->whenLoaded('members')),
            'created_at' => $this->created_at,
        ];
    }
}
