<?php

namespace App\Models;

use App\Enums\DisbursementMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BenevolentDisbursement extends Model
{
    /** @use HasFactory<\Database\Factories\BenevolentDisbursementFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'benevolent_request_id',
        'amount',
        'method',
        'reference_number',
        'disbursed_by',
        'disbursed_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'method' => DisbursementMethod::class,
            'amount' => 'decimal:2',
            'disbursed_at' => 'datetime',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(BenevolentRequest::class, 'benevolent_request_id');
    }

    public function disbursedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disbursed_by');
    }
}
