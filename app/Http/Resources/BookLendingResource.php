<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookLendingResource extends JsonResource
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
            'book' => $this->whenLoaded('book', fn () => [
                'id' => $this->book->id,
                'title' => $this->book->title,
                'slug' => $this->book->slug,
                'author' => $this->book->author,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'lender' => $this->whenLoaded('lender', fn () => [
                'id' => $this->lender->id,
                'name' => $this->lender->name,
            ]),
            'borrowed_at' => $this->borrowed_at,
            'due_at' => $this->due_at,
            'returned_at' => $this->returned_at,
            'is_returned' => $this->isReturned(),
            'is_overdue' => ! $this->isReturned() && $this->due_at->isPast(),
            'notes' => $this->notes,
        ];
    }
}
