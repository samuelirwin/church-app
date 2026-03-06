<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        User::factory()->staff()->create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
        ]);

        User::factory()->leader()->create([
            'name' => 'Leader User',
            'email' => 'leader@example.com',
        ]);

        User::factory()->create([
            'name' => 'Member User',
            'email' => 'member@example.com',
        ]);
    }
}
