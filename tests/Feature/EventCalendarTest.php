<?php

use App\Models\Event;

it('returns ics file with correct content type', function () {
    $event = Event::factory()->published()->create();

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'text/calendar; charset=utf-8');
    $response->assertHeader('Content-Disposition');
});

it('contains required icalendar fields', function () {
    $event = Event::factory()->published()->create([
        'title' => 'Sunday Service',
        'description' => 'Weekly gathering',
        'location' => 'Main Hall',
    ]);

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $content = $response->content();
    expect($content)
        ->toContain('BEGIN:VCALENDAR')
        ->toContain('END:VCALENDAR')
        ->toContain('BEGIN:VEVENT')
        ->toContain('END:VEVENT')
        ->toContain('SUMMARY:Sunday Service')
        ->toContain('DESCRIPTION:Weekly gathering')
        ->toContain('LOCATION:Main Hall')
        ->toContain('DTSTART:')
        ->toContain('VERSION:2.0');
});

it('uses date format for all-day events', function () {
    $event = Event::factory()->published()->allDay()->create([
        'starts_at' => '2026-04-15 00:00:00',
    ]);

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $content = $response->content();
    expect($content)
        ->toContain('DTSTART;VALUE=DATE:20260415')
        ->not->toContain('DTSTART:20260415T');
});

it('uses utc datetime format for timed events', function () {
    $event = Event::factory()->published()->create([
        'starts_at' => '2026-04-15 14:00:00',
        'ends_at' => '2026-04-15 16:00:00',
        'is_all_day' => false,
    ]);

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $content = $response->content();
    expect($content)
        ->toContain('DTSTART:')
        ->toContain('DTEND:')
        ->toMatch('/DTSTART:\d{8}T\d{6}Z/')
        ->toMatch('/DTEND:\d{8}T\d{6}Z/');
});

it('returns 404 for unpublished events', function () {
    $event = Event::factory()->draft()->create();

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $response->assertNotFound();
});

it('escapes special characters in text fields', function () {
    $event = Event::factory()->published()->create([
        'title' => 'Service, Prayer; Meeting',
        'description' => "Line one\nLine two",
        'location' => 'Room 1, Building A; Floor 2',
    ]);

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $content = $response->content();
    expect($content)
        ->toContain('SUMMARY:Service\\, Prayer\\; Meeting')
        ->toContain('DESCRIPTION:Line one\\nLine two')
        ->toContain('LOCATION:Room 1\\, Building A\\; Floor 2');
});

it('includes event url in ics output', function () {
    $event = Event::factory()->published()->create();

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $content = $response->content();
    expect($content)->toContain('URL:');
    expect($content)->toContain("/events/{$event->slug}");
});

it('handles events without description or location', function () {
    $event = Event::factory()->published()->create([
        'description' => null,
        'location' => null,
    ]);

    $response = $this->get("/events/{$event->slug}/calendar.ics");

    $response->assertSuccessful();
    $content = $response->content();
    expect($content)
        ->not->toContain('DESCRIPTION:')
        ->not->toContain('LOCATION:');
});
