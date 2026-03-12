<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Admin User', 'email' => 'admin@example.com', 'role' => UserRole::Admin],
            ['name' => 'Staff User', 'email' => 'staff@example.com', 'role' => UserRole::Staff],
            ['name' => 'Leader User', 'email' => 'leader@example.com', 'role' => UserRole::Leader],
            ['name' => 'Member User', 'email' => 'member@example.com', 'role' => UserRole::Member],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'role' => $userData['role'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
