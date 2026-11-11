<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Every existing user account gets a matching member record so the
 * directory starts complete. We use the query builder here instead of
 * models so the migration keeps working even if the models change later.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereNotIn('id', DB::table('members')->whereNotNull('user_id')->select('user_id'))
            ->orderBy('id')
            ->each(function (object $user): void {
                $nameParts = explode(' ', trim($user->name), 2);

                DB::table('members')->insert([
                    'user_id' => $user->id,
                    'first_name' => $nameParts[0],
                    'last_name' => $nameParts[1] ?? null,
                    'email' => $user->email,
                    'membership_status' => 'member',
                    'joined_at' => substr((string) $user->created_at, 0, 10) ?: null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('members')->whereNotNull('user_id')->delete();
    }
};
