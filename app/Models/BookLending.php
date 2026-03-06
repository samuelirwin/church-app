<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookLending extends Model
{
    /** @use HasFactory<\Database\Factories\BookLendingFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'book_id',
        'user_id',
        'borrowed_at',
        'due_at',
        'returned_at',
        'notes',
        'lent_by',
        'returned_to',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'borrowed_at' => 'datetime',
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    /**
     * Get the book being lent.
     */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    /**
     * Get the borrower.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the staff member who lent the book.
     */
    public function lender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lent_by');
    }

    /**
     * Get the staff member who accepted the return.
     */
    public function returner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_to');
    }

    /**
     * Scope to active (not returned) lendings.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('returned_at');
    }

    /**
     * Scope to overdue lendings.
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $query->whereNull('returned_at')
            ->where('due_at', '<', now());
    }

    /**
     * Check if this lending has been returned.
     */
    public function isReturned(): bool
    {
        return $this->returned_at !== null;
    }

    /**
     * Check if this lending is overdue.
     */
    public function isOverdue(): bool
    {
        return ! $this->isReturned() && $this->due_at->isPast();
    }
}
