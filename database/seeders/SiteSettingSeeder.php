<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'general' => [
                'church_name' => config('app.name'),
                'tagline' => null,
                'address' => null,
                'phone' => null,
                'email' => null,
                'hero_tagline' => 'Join us this Sunday',
                'hero_heading' => 'Welcome Home',
                'hero_subheading' => 'A place where faith grows, community thrives, and everyone belongs.',
            ],
            'social' => [
                'links' => '[]',
            ],
        ];

        foreach ($defaults as $group => $settings) {
            foreach ($settings as $key => $value) {
                SiteSetting::query()->firstOrCreate(
                    ['group' => $group, 'key' => $key],
                    ['value' => $value],
                );
            }
        }
    }
}
