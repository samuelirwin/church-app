<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A piece of practical help for a care need, e.g. "Dinner on Tuesday" or
 * "Drive to hospital appointment", that a volunteer can take on.
 */
class CareNeedTask extends Model
{
    /** @use HasFactory<\Database\Factories\CareNeedTaskFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'care_need_id',
        'description',
        'due_on',
        'volunteer_id',
        'completed_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_on' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function careNeed(): BelongsTo
    {
        return $this->belongsTo(CareNeed::class);
    }

    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'volunteer_id');
    }

    public function isComplete(): bool
    {
        return $this->completed_at !== null;
    }
}
