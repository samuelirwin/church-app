<?php

use App\Models\BenevolentRequest;
use App\Models\BookLending;
use App\Models\CounselingCase;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Form;
use App\Models\FormResponse;
use App\Models\User;
use App\Models\Visitor;

it('exports users as CSV', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.users', ['format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload('users.csv');
});

it('exports users as PDF', function () {
    $admin = User::factory()->admin()->create();
    User::factory()->count(2)->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.users', ['format' => 'pdf']))
        ->assertSuccessful()
        ->assertDownload('users-report.pdf');
});

it('exports event registrations as CSV', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->published()->create();
    EventRegistration::factory()->count(3)->create(['event_id' => $event->id]);

    $this->actingAs($admin)
        ->get(route('admin.exports.event-registrations', ['event' => $event->id, 'format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload("event-{$event->id}-registrations.csv");
});

it('exports event registrations as PDF', function () {
    $admin = User::factory()->admin()->create();
    $event = Event::factory()->published()->create();
    EventRegistration::factory()->count(2)->create(['event_id' => $event->id]);

    $this->actingAs($admin)
        ->get(route('admin.exports.event-registrations', ['event' => $event->id, 'format' => 'pdf']))
        ->assertSuccessful()
        ->assertDownload("event-{$event->id}-registrations.pdf");
});

it('exports form responses as CSV', function () {
    $admin = User::factory()->admin()->create();
    $form = Form::factory()->published()->create();
    FormResponse::factory()->count(3)->create(['form_id' => $form->id]);

    $this->actingAs($admin)
        ->get(route('admin.exports.form-responses', ['form' => $form->slug, 'format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload("form-{$form->id}-responses.csv");
});

it('exports visitors as CSV', function () {
    $admin = User::factory()->admin()->create();
    Visitor::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.visitors', ['format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload('visitors.csv');
});

it('exports visitors as PDF', function () {
    $admin = User::factory()->admin()->create();
    Visitor::factory()->count(2)->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.visitors', ['format' => 'pdf']))
        ->assertSuccessful()
        ->assertDownload('visitors-report.pdf');
});

it('exports book lendings as CSV', function () {
    $admin = User::factory()->admin()->create();
    BookLending::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.book-lendings', ['format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload('book-lendings.csv');
});

it('exports benevolent requests as CSV', function () {
    $admin = User::factory()->admin()->create();
    BenevolentRequest::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.benevolent-requests', ['format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload('benevolent-requests.csv');
});

it('exports benevolent requests as PDF', function () {
    $admin = User::factory()->admin()->create();
    BenevolentRequest::factory()->count(2)->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.benevolent-requests', ['format' => 'pdf']))
        ->assertSuccessful()
        ->assertDownload('benevolence-report.pdf');
});

it('exports counseling cases as CSV with redacted data', function () {
    $admin = User::factory()->admin()->create();
    CounselingCase::factory()->count(3)->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.exports.counseling-cases', ['format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload('counseling-cases.csv');

    $content = file_get_contents($response->getFile()->getPathname());
    expect($content)->toContain('Case Number');
    expect($content)->not->toContain('client_id');
});

it('forbids exports for regular members', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.exports.users'))
        ->assertForbidden();
});

it('returns valid CSV with correct headers for users export', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->get(route('admin.exports.users', ['format' => 'csv']))
        ->assertSuccessful();

    $content = file_get_contents($response->getFile()->getPathname());
    expect($content)->toContain('Name');
    expect($content)->toContain('Email');
    expect($content)->toContain('Role');
});

it('returns valid file even with empty dataset', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.exports.book-lendings', ['format' => 'csv']))
        ->assertSuccessful()
        ->assertDownload('book-lendings.csv');
});
