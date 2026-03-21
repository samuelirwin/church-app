<?php

namespace App\Models;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CounselingCase extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\CounselingCaseFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'case_number',
        'person_name',
        'person_contact',
        'person_email',
        'case_type',
        'status',
        'presenting_issue',
        'background_notes',
        'referral_source',
        'assigned_counselor_id',
        'opened_by',
        'opened_at',
        'closed_at',
        'closure_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'case_type' => CaseType::class,
            'status' => CaseStatus::class,
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (CounselingCase $case): void {
            if (empty($case->case_number)) {
                $year = now()->year;
                $lastNumber = static::query()
                    ->where('case_number', 'like', "CC-{$year}-%")
                    ->count();
                $case->case_number = sprintf('CC-%d-%04d', $year, $lastNumber + 1);
            }
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('case_documents');
    }

    public function assignedCounselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_counselor_id');
    }

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(CounselingSession::class);
    }

    public function goals(): HasMany
    {
        return $this->hasMany(CounselingGoal::class)->orderBy('priority');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(CounselingReferral::class);
    }

    /**
     * Scope to cases visible to the given user.
     * Admins and deacons see all; assigned counselors see only their cases.
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin() || $user->isDeacon()) {
            return $query;
        }

        return $query->where('assigned_counselor_id', $user->id);
    }

    /**
     * Check if the given user can view this case.
     */
    public function isVisibleTo(User $user): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->assigned_counselor_id === $user->id;
    }
}
