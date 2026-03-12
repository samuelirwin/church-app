<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Form extends Model
{
    /** @use HasFactory<\Database\Factories\FormFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'fields' => '[]',
        'settings' => '{}',
    ];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'fields',
        'settings',
        'is_multi_step',
        'is_published',
        'allows_anonymous',
        'expires_at',
        'max_responses',
        'notification_emails',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'settings' => 'array',
            'is_multi_step' => 'boolean',
            'is_published' => 'boolean',
            'allows_anonymous' => 'boolean',
            'expires_at' => 'datetime',
            'max_responses' => 'integer',
            'notification_emails' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Form $form): void {
            if (empty($form->slug)) {
                $form->slug = Str::slug($form->title);
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Get the form creator.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all responses for this form.
     */
    public function responses(): HasMany
    {
        return $this->hasMany(FormResponse::class);
    }

    /**
     * Scope to only published forms.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope to only active forms (published + not expired).
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_published', true)
            ->where(function (Builder $q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Check if this form is currently active and accepting responses.
     */
    public function isActive(): bool
    {
        if (! $this->is_published) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_responses && $this->responses()->count() >= $this->max_responses) {
            return false;
        }

        return true;
    }

    /**
     * Check if scoring is enabled for this form.
     */
    public function isScoringEnabled(): bool
    {
        return ($this->settings['scoring_enabled'] ?? false) === true;
    }

    /**
     * Check if only one response per user is allowed.
     */
    public function isOneResponsePerUser(): bool
    {
        return ($this->settings['one_response_per_user'] ?? false) === true;
    }

    /**
     * Get the confirmation message from settings.
     */
    public function getConfirmationMessage(): string
    {
        return $this->settings['confirmation_message'] ?? 'Thank you for your submission!';
    }

    /**
     * Calculate the total possible score from all fields.
     */
    public function totalPoints(): int
    {
        return collect($this->fields ?? [])
            ->sum(fn (array $field) => $field['points'] ?? 0);
    }
}
