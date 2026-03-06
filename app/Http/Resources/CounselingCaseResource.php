<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CounselingCaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'case_number' => $this->case_number,
            'person_name' => $this->person_name,
            'person_contact' => $this->person_contact,
            'person_email' => $this->person_email,
            'case_type' => $this->case_type->value,
            'case_type_label' => $this->case_type->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'presenting_issue' => $this->presenting_issue,
            'background_notes' => $this->background_notes,
            'referral_source' => $this->referral_source,
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'closure_reason' => $this->closure_reason,
            'assigned_counselor' => $this->whenLoaded('assignedCounselor', fn () => $this->assignedCounselor ? [
                'id' => $this->assignedCounselor->id,
                'name' => $this->assignedCounselor->name,
            ] : null),
            'opened_by' => $this->whenLoaded('openedBy', fn () => $this->openedBy ? [
                'id' => $this->openedBy->id,
                'name' => $this->openedBy->name,
            ] : null),
            'sessions' => $this->whenLoaded('sessions', fn () => $this->sessions->map(fn ($s) => [
                'id' => $s->id,
                'session_date' => $s->session_date,
                'duration_minutes' => $s->duration_minutes,
                'session_type' => $s->session_type->value,
                'session_type_label' => $s->session_type->label(),
                'notes' => $s->notes,
                'mood_rating' => $s->mood_rating,
                'progress_notes' => $s->progress_notes,
                'next_session_date' => $s->next_session_date,
                'counselor' => $s->counselor ? [
                    'id' => $s->counselor->id,
                    'name' => $s->counselor->name,
                ] : null,
                'documents' => $s->getMedia('session_documents')->map(fn ($media) => [
                    'id' => $media->id,
                    'name' => $media->file_name,
                    'size' => $media->size,
                    'url' => $media->getUrl(),
                ]),
            ])),
            'sessions_count' => $this->whenCounted('sessions'),
            'goals' => $this->whenLoaded('goals', fn () => $this->goals->map(fn ($g) => [
                'id' => $g->id,
                'title' => $g->title,
                'description' => $g->description,
                'target_date' => $g->target_date,
                'status' => $g->status->value,
                'status_label' => $g->status->label(),
                'priority' => $g->priority,
                'is_achieved' => $g->isAchieved(),
                'created_by' => $g->createdBy ? [
                    'id' => $g->createdBy->id,
                    'name' => $g->createdBy->name,
                ] : null,
            ])),
            'referrals' => $this->whenLoaded('referrals', fn () => $this->referrals->map(fn ($r) => [
                'id' => $r->id,
                'referred_to' => $r->referred_to,
                'referral_type' => $r->referral_type->value,
                'referral_type_label' => $r->referral_type->label(),
                'referral_date' => $r->referral_date,
                'reason' => $r->reason,
                'outcome' => $r->outcome,
                'referred_by' => $r->referredBy ? [
                    'id' => $r->referredBy->id,
                    'name' => $r->referredBy->name,
                ] : null,
                'documents' => $r->getMedia('referral_documents')->map(fn ($media) => [
                    'id' => $media->id,
                    'name' => $media->file_name,
                    'size' => $media->size,
                    'url' => $media->getUrl(),
                ]),
            ])),
            'case_documents' => $this->getMedia('case_documents')->map(fn ($media) => [
                'id' => $media->id,
                'name' => $media->file_name,
                'size' => $media->size,
                'mime_type' => $media->mime_type,
                'url' => $media->getUrl(),
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
