<?php

namespace App\Models;

use App\Enums\SessionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CounselingSession extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\CounselingSessionFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'counseling_case_id',
        'counselor_id',
        'session_date',
        'duration_minutes',
        'session_type',
        'notes',
        'mood_rating',
        'progress_notes',
        'next_session_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'session_type' => SessionType::class,
            'session_date' => 'datetime',
            'duration_minutes' => 'integer',
            'mood_rating' => 'integer',
            'next_session_date' => 'date',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('session_documents');
    }

    public function counselingCase(): BelongsTo
    {
        return $this->belongsTo(CounselingCase::class);
    }

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }
}
