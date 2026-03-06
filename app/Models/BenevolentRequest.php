<?php

namespace App\Models;

use App\Enums\BenevolentCategory;
use App\Enums\BenevolentStatus;
use App\Enums\BenevolentUrgency;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class BenevolentRequest extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\BenevolentRequestFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'requester_name',
        'requester_contact',
        'category',
        'description',
        'amount_requested',
        'urgency',
        'status',
        'amount_approved',
        'final_decision_by',
        'final_decision_at',
        'final_decision_notes',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => BenevolentCategory::class,
            'status' => BenevolentStatus::class,
            'urgency' => BenevolentUrgency::class,
            'amount_requested' => 'decimal:2',
            'amount_approved' => 'decimal:2',
            'final_decision_at' => 'datetime',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('evidence');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function finalDecisionBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'final_decision_by');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(BenevolentReview::class);
    }

    public function disbursements(): HasMany
    {
        return $this->hasMany(BenevolentDisbursement::class);
    }

    public function scopeByStatus(Builder $query, BenevolentStatus $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeByCategory(Builder $query, BenevolentCategory $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeByUrgency(Builder $query, BenevolentUrgency $urgency): Builder
    {
        return $query->where('urgency', $urgency);
    }

    /**
     * Get the total amount disbursed across all disbursements.
     */
    public function totalDisbursed(): float
    {
        return (float) $this->disbursements()->sum('amount');
    }

    public function isPending(): bool
    {
        return $this->status === BenevolentStatus::Pending;
    }

    public function isDecided(): bool
    {
        return in_array($this->status, [
            BenevolentStatus::Approved,
            BenevolentStatus::PartiallyApproved,
            BenevolentStatus::Denied,
            BenevolentStatus::Closed,
        ]);
    }
}
