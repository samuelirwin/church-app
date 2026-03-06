<?php

namespace Database\Seeders;

use App\Enums\PageLayout;
use App\Enums\PageSectionType;
use App\Enums\SectionAlignment;
use App\Models\Page;
use App\Models\User;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('role', 'admin')->first()
            ?? User::factory()->admin()->create();

        Page::factory()->published()->create([
            'title' => 'About Us',
            'slug' => 'about-us',
            'description' => 'Learn about our church and mission.',
            'layout' => PageLayout::FullWidth,
            'created_by' => $admin->id,
            'sections' => [
                [
                    'id' => 'section_1',
                    'type' => PageSectionType::RichText->value,
                    'alignment' => SectionAlignment::Full->value,
                    'data' => ['content' => '<h2>Our Story</h2><p>Welcome to our church community. We are a family of believers committed to serving God and our local community.</p>'],
                ],
                [
                    'id' => 'section_2',
                    'type' => PageSectionType::CallToAction->value,
                    'alignment' => SectionAlignment::Center->value,
                    'data' => [
                        'heading' => 'Join Us This Sunday',
                        'body' => 'Experience worship, community, and growth with us.',
                        'button_label' => 'Plan Your Visit',
                        'button_url' => '/visit',
                    ],
                ],
            ],
        ]);

        Page::factory()->published()->create([
            'title' => 'What We Believe',
            'slug' => 'what-we-believe',
            'description' => 'Our statement of faith and core beliefs.',
            'layout' => PageLayout::Landing,
            'created_by' => $admin->id,
            'sections' => [
                [
                    'id' => 'section_1',
                    'type' => PageSectionType::RichText->value,
                    'alignment' => SectionAlignment::Full->value,
                    'data' => ['content' => '<h2>Statement of Faith</h2><p>We believe in the Bible as the inspired Word of God, the Trinity, and salvation by grace through faith.</p>'],
                ],
            ],
        ]);

        Page::factory()->published()->create([
            'title' => 'Contact Us',
            'slug' => 'contact-us',
            'description' => 'Get in touch with our church.',
            'layout' => PageLayout::FullWidth,
            'created_by' => $admin->id,
            'sections' => [
                [
                    'id' => 'section_1',
                    'type' => PageSectionType::RichText->value,
                    'alignment' => SectionAlignment::Full->value,
                    'data' => ['content' => '<h2>Get In Touch</h2><p>We would love to hear from you. Fill out the form below or visit us at our location.</p>'],
                ],
                [
                    'id' => 'section_2',
                    'type' => PageSectionType::VideoEmbed->value,
                    'alignment' => SectionAlignment::Center->value,
                    'data' => ['url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
                ],
            ],
        ]);
    }
}
