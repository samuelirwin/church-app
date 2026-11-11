<?php

namespace App\Models;

use App\Enums\CareNeedStatus;
use App\Enums\ContactMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One entry on a care need's timeline: a note, a call or visit, or a status change.
 */
class CareNeedUpdate extends Model
{
    /** @use HasFactory<\Database\Factories\CareNeedUpdateFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'care_need_id',
        'user_id',
        'body',
        'contact_method',
        'from_status',
        'to_status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'contact_method' => ContactMethod::class,
            'from_status' => CareNeedStatus::class,
            'to_status' => CareNeedStatus::class,
        ];
    }

    public function careNeed(): BelongsTo
    {
        return $this->belongsTo(CareNeed::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
