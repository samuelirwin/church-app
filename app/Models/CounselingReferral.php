<?php

namespace App\Models;

use App\Enums\ReferralType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CounselingReferral extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\CounselingReferralFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'counseling_case_id',
        'referred_to',
        'referral_type',
        'referral_date',
        'reason',
        'outcome',
        'referred_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'referral_type' => ReferralType::class,
            'referral_date' => 'date',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('referral_documents');
    }

    public function counselingCase(): BelongsTo
    {
        return $this->belongsTo(CounselingCase::class);
    }

    public function referredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }
}
