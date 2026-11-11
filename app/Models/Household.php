<?php

namespace App\Models;

use App\Enums\HouseholdRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Household extends Model
{
    /** @use HasFactory<\Database\Factories\HouseholdFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'notes',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    /**
     * The member marked as head of the household acts as its primary contact.
     */
    public function head(): HasOne
    {
        return $this->hasOne(Member::class)->where('household_role', HouseholdRole::Head);
    }
}
