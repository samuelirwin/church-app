<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BenevolentRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'requester_name' => $this->requester_name,
            'requester_contact' => $this->requester_contact,
            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'description' => $this->description,
            'amount_requested' => $this->amount_requested,
            'urgency' => $this->urgency->value,
            'urgency_label' => $this->urgency->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'amount_approved' => $this->amount_approved,
            'final_decision_notes' => $this->final_decision_notes,
            'final_decision_at' => $this->final_decision_at,
            'final_decision_by' => $this->whenLoaded('finalDecisionBy', fn () => $this->finalDecisionBy ? [
                'id' => $this->finalDecisionBy->id,
                'name' => $this->finalDecisionBy->name,
            ] : null),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'reviews' => $this->whenLoaded('reviews', fn () => $this->reviews->map(fn ($review) => [
                'id' => $review->id,
                'recommendation' => $review->recommendation->value,
                'recommendation_label' => $review->recommendation->label(),
                'amount_recommended' => $review->amount_recommended,
                'comments' => $review->comments,
                'reviewed_at' => $review->reviewed_at,
                'reviewer' => $review->reviewer ? [
                    'id' => $review->reviewer->id,
                    'name' => $review->reviewer->name,
                ] : null,
            ])),
            'reviews_count' => $this->whenCounted('reviews'),
            'disbursements' => $this->whenLoaded('disbursements', fn () => $this->disbursements->map(fn ($d) => [
                'id' => $d->id,
                'amount' => $d->amount,
                'method' => $d->method->value,
                'method_label' => $d->method->label(),
                'reference_number' => $d->reference_number,
                'disbursed_at' => $d->disbursed_at,
                'notes' => $d->notes,
                'disbursed_by' => $d->disbursedBy ? [
                    'id' => $d->disbursedBy->id,
                    'name' => $d->disbursedBy->name,
                ] : null,
            ])),
            'evidence' => $this->getMedia('evidence')->map(fn ($media) => [
                'id' => $media->id,
                'name' => $media->file_name,
                'size' => $media->size,
                'mime_type' => $media->mime_type,
                'url' => $media->getUrl(),
            ])->values()->all(),
            'total_disbursed' => $this->whenLoaded('disbursements', fn () => (float) $this->disbursements->sum('amount')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
