<?php

namespace App\Services;

use App\Enums\MembershipStatus;
use App\Models\Member;
use App\Models\User;
use App\Models\Visitor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Keeps member records and user accounts in step. Anything that creates a
 * member, links it to a login, or changes its status should go through here
 * so the status history and logs stay consistent.
 */
class MemberService
{
    /**
     * Create a member and record their starting status in the history.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes, ?User $createdBy = null): Member
    {
        return DB::transaction(function () use ($attributes, $createdBy) {
            $member = Member::create($attributes);

            $member->statusChanges()->create([
                'from_status' => null,
                'to_status' => $member->membership_status,
                'changed_by' => $createdBy?->id,
                'reason' => 'Member record created',
            ]);

            Log::info('Member created', [
                'member_id' => $member->id,
                'user_id' => $member->user_id,
                'status' => $member->membership_status->value,
                'created_by' => $createdBy?->id,
            ]);

            return $member;
        });
    }

    /**
     * Make sure a user account has a member record.
     * Reuses an unlinked member with the same email before creating a new one,
     * so a person added by staff is not duplicated when they later register.
     */
    public function syncFromUser(User $user, MembershipStatus $status = MembershipStatus::Regular): Member
    {
        $existing = Member::query()->where('user_id', $user->id)->first();

        if ($existing) {
            return $existing;
        }

        $unlinked = Member::query()
            ->whereNull('user_id')
            ->where('email', $user->email)
            ->first();

        if ($unlinked) {
            return $this->linkUser($unlinked, $user);
        }

        $nameParts = explode(' ', trim($user->name), 2);

        return $this->create([
            'user_id' => $user->id,
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1] ?? null,
            'email' => $user->email,
            'membership_status' => $status,
            'joined_at' => now()->toDateString(),
        ]);
    }

    /**
     * Build a member record from a visitor who has been converted.
     */
    public function createFromVisitor(Visitor $visitor, User $user, ?User $convertedBy = null): Member
    {
        $member = $this->syncFromUser($user);

        $member->fill([
            'phone' => $member->phone ?? $visitor->phone,
            'address_line_1' => $member->address_line_1 ?? $visitor->address,
        ])->save();

        Log::info('Member created from visitor', [
            'member_id' => $member->id,
            'visitor_id' => $visitor->id,
            'converted_by' => $convertedBy?->id,
        ]);

        return $member;
    }

    public function linkUser(Member $member, User $user): Member
    {
        $member->update(['user_id' => $user->id]);

        Log::info('Member linked to user account', [
            'member_id' => $member->id,
            'user_id' => $user->id,
        ]);

        return $member;
    }

    /**
     * Create a login for a member who doesn't have one and email them a
     * password reset link so they can set their own password.
     */
    public function inviteToAccount(Member $member, User $invitedBy): User
    {
        $user = DB::transaction(function () use ($member) {
            $user = User::create([
                'name' => $member->full_name,
                'email' => $member->email,
                'password' => Str::random(32),
            ]);

            $this->linkUser($member, $user);

            return $user;
        });

        Password::sendResetLink(['email' => $user->email]);

        Log::info('Member invited to create an account', [
            'member_id' => $member->id,
            'user_id' => $user->id,
            'invited_by' => $invitedBy->id,
        ]);

        return $user;
    }

    /**
     * Move a member to a new status and keep a record of who changed it and why.
     * Does nothing when the status is unchanged.
     */
    public function changeStatus(Member $member, MembershipStatus $status, ?User $changedBy = null, ?string $reason = null): void
    {
        $previous = $member->membership_status;

        if ($previous === $status) {
            return;
        }

        DB::transaction(function () use ($member, $status, $previous, $changedBy, $reason) {
            $member->update(['membership_status' => $status]);

            $member->statusChanges()->create([
                'from_status' => $previous,
                'to_status' => $status,
                'changed_by' => $changedBy?->id,
                'reason' => $reason,
            ]);
        });

        Log::info('Member status changed', [
            'member_id' => $member->id,
            'from' => $previous?->value,
            'to' => $status->value,
            'changed_by' => $changedBy?->id,
        ]);
    }
}
