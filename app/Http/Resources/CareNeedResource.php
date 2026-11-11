<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CareNeedResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'person_name' => $this->person_name,
            'member_id' => $this->member_id,
            'requester_name' => $this->requester_name,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'priority' => $this->priority->value,
            'priority_label' => $this->priority->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'source_label' => $this->source->label(),
            'is_confidential' => $this->is_confidential,
            'share_on_prayer_wall' => $this->share_on_prayer_wall,
            'assigned_to' => $this->assigned_to,
            'assignee' => $this->whenLoaded('assignee', fn () => $this->assignee ? ['id' => $this->assignee->id, 'name' => $this->assignee->name] : null),
            'due_on' => $this->due_on?->toDateString(),
            'is_overdue' => $this->isOverdue(),
            'resolved_at' => $this->resolved_at,
            'benevolent_request_id' => $this->benevolent_request_id,
            'counseling_case_id' => $this->counseling_case_id,
            'tasks_count' => $this->whenCounted('tasks'),
            'created_at' => $this->created_at,
        ];
    }
}
