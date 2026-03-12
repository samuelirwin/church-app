<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormResponse extends Model
{
    /** @use HasFactory<\Database\Factories\FormResponseFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'answers' => '{}',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'form_id',
        'user_id',
        'answers',
        'score',
        'ip_address',
        'user_agent',
        'submitted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'score' => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Get the form this response belongs to.
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /**
     * Get the user who submitted this response.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this response is from an anonymous user.
     */
    public function isAnonymous(): bool
    {
        return $this->user_id === null;
    }
}
