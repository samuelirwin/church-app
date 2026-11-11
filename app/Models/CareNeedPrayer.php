<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Records that a member prayed for a prayer wall request (once per person).
 */
class CareNeedPrayer extends Model
{
    /** @use HasFactory<\Database\Factories\CareNeedPrayerFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'care_need_id',
        'user_id',
    ];

    public function careNeed(): BelongsTo
    {
        return $this->belongsTo(CareNeed::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
