<?php

namespace App\Models;

use App\Enums\ReviewRecommendation;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BenevolentReview extends Model
{
    /** @use HasFactory<\Database\Factories\BenevolentReviewFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'benevolent_request_id',
        'user_id',
        'recommendation',
        'amount_recommended',
        'comments',
        'reviewed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'recommendation' => ReviewRecommendation::class,
            'amount_recommended' => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(BenevolentRequest::class, 'benevolent_request_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
