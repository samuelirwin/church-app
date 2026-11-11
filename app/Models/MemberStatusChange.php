<?php

namespace App\Models;

use App\Enums\MembershipStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberStatusChange extends Model
{
    /** @use HasFactory<\Database\Factories\MemberStatusChangeFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'member_id',
        'from_status',
        'to_status',
        'changed_by',
        'reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'from_status' => MembershipStatus::class,
            'to_status' => MembershipStatus::class,
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
