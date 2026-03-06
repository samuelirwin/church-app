<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Staff = 'staff';
    case Leader = 'leader';
    case Member = 'member';

    /**
     * Check if this role has at least the given role's access level.
     */
    public function hasAccessLevel(self $requiredRole): bool
    {
        return $this->accessLevel() >= $requiredRole->accessLevel();
    }

    /**
     * Get the numeric access level for role hierarchy comparison.
     * Higher value = more access.
     */
    public function accessLevel(): int
    {
        return match ($this) {
            self::Admin => 40,
            self::Staff => 30,
            self::Leader => 20,
            self::Member => 10,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Staff => 'Staff',
            self::Leader => 'Leader',
            self::Member => 'Member',
        };
    }
}
