<?php

namespace App\Http\Resources;

use App\Models\VisitorFollowUp;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Visitor data for the admin pages. Exposes the follow-up status as
 * `status` + `status_label`, which is what the list and detail views read.
 */
class VisitorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'first_visit_date' => $this->first_visit_date?->toDateString(),
            'how_heard' => $this->how_heard,
            'prayer_requests' => $this->prayer_requests,
            'notes' => $this->notes,
            'status' => $this->follow_up_status->value,
            'status_label' => $this->follow_up_status->label(),
            'assigned_to' => $this->assigned_to,
            'assigned_user' => $this->whenLoaded('assignedUser', fn () => $this->assignedUser ? [
                'id' => $this->assignedUser->id,
                'name' => $this->assignedUser->name,
            ] : null),
            'converted_user' => $this->whenLoaded('convertedUser', fn () => $this->convertedUser ? [
                'id' => $this->convertedUser->id,
                'name' => $this->convertedUser->name,
            ] : null),
            'follow_ups_count' => $this->whenCounted('followUps'),
            'follow_ups' => $this->whenLoaded('followUps', fn () => $this->followUps
                ->sortByDesc('followed_up_at')
                ->values()
                ->map(fn (VisitorFollowUp $followUp) => [
                    'id' => $followUp->id,
                    'type' => $followUp->type->value,
                    'type_label' => $followUp->type->label(),
                    'notes' => $followUp->notes,
                    'followed_up_at' => $followUp->followed_up_at?->toDateString(),
                    'user' => $followUp->user ? ['id' => $followUp->user->id, 'name' => $followUp->user->name] : null,
                ])),
            'created_at' => $this->created_at,
        ];
    }
}
