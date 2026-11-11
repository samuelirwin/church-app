<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'preferred_name' => $this->preferred_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'age' => $this->age,
            'gender' => $this->gender?->value,
            'gender_label' => $this->gender?->label(),
            'marital_status' => $this->marital_status?->value,
            'marital_status_label' => $this->marital_status?->label(),
            'household_id' => $this->household_id,
            'household_role' => $this->household_role?->value,
            'household_role_label' => $this->household_role?->label(),
            'address_line_1' => $this->address_line_1,
            'address_line_2' => $this->address_line_2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'membership_status' => $this->membership_status->value,
            'membership_status_label' => $this->membership_status->label(),
            'joined_at' => $this->joined_at?->toDateString(),
            'baptized_at' => $this->baptized_at?->toDateString(),
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'notes' => $this->when($request->user()?->isStaffOrAbove(), $this->notes),
            'photo_url' => $this->getFirstMediaUrl('photo') ?: null,
            'household' => $this->whenLoaded('household', fn () => $this->household ? [
                'id' => $this->household->id,
                'name' => $this->household->name,
            ] : null),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'role' => $this->user->role->value,
            ] : null),
            'status_changes' => $this->whenLoaded('statusChanges', fn () => $this->statusChanges->map(fn ($change) => [
                'id' => $change->id,
                'from_label' => $change->from_status?->label(),
                'to_label' => $change->to_status->label(),
                'reason' => $change->reason,
                'changed_by' => $change->changedBy?->name,
                'created_at' => $change->created_at,
            ])),
            'deleted_at' => $this->deleted_at,
            'created_at' => $this->created_at,
        ];
    }
}
