<?php

namespace App\Models;

use App\Enums\FollowUpType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorFollowUp extends Model
{
    /** @use HasFactory<\Database\Factories\VisitorFollowUpFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'visitor_id',
        'user_id',
        'type',
        'notes',
        'followed_up_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => FollowUpType::class,
            'followed_up_at' => 'datetime',
        ];
    }

    public function visitor(): BelongsTo
    {
        return $this->belongsTo(Visitor::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
