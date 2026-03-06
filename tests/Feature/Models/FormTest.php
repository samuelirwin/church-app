<?php

use App\Models\Form;
use App\Models\FormResponse;
use App\Models\User;

it('auto-generates slug from title on creation', function () {
    $form = Form::factory()->create(['title' => 'Visitor Registration Form']);

    expect($form->slug)->toBe('visitor-registration-form');
});

it('belongs to a creator', function () {
    $user = User::factory()->create();
    $form = Form::factory()->create(['created_by' => $user->id]);

    expect($form->creator->id)->toBe($user->id);
});

it('has many responses', function () {
    $form = Form::factory()->create();
    FormResponse::factory()->count(3)->create(['form_id' => $form->id]);

    expect($form->responses)->toHaveCount(3);
});

it('scopes to published forms only', function () {
    Form::factory()->published()->create();
    Form::factory()->unpublished()->create();

    expect(Form::published()->count())->toBe(1);
});

it('scopes to active forms excluding expired', function () {
    Form::factory()->published()->create();
    Form::factory()->expired()->create();
    Form::factory()->unpublished()->create();

    expect(Form::active()->count())->toBe(1);
});

it('reports isActive correctly for published non-expired form', function () {
    $form = Form::factory()->published()->create();

    expect($form->isActive())->toBeTrue();
});

it('reports isActive false for expired form', function () {
    $form = Form::factory()->expired()->create();

    expect($form->isActive())->toBeFalse();
});

it('reports isActive false for unpublished form', function () {
    $form = Form::factory()->unpublished()->create();

    expect($form->isActive())->toBeFalse();
});

it('reports isActive false when max responses reached', function () {
    $form = Form::factory()->published()->maxResponses(1)->create();
    FormResponse::factory()->create(['form_id' => $form->id]);

    expect($form->isActive())->toBeFalse();
});

it('checks one response per user setting', function () {
    $form = Form::factory()->onePerUser()->create();

    expect($form->isOneResponsePerUser())->toBeTrue();
});

it('checks scoring enabled setting', function () {
    $form = Form::factory()->withScoring()->create();

    expect($form->isScoringEnabled())->toBeTrue();
});

it('calculates total points from fields', function () {
    $form = Form::factory()->create([
        'fields' => [
            ['id' => 'q1', 'type' => 'radio', 'label' => 'Q1', 'points' => 10, 'step' => 1],
            ['id' => 'q2', 'type' => 'radio', 'label' => 'Q2', 'points' => 20, 'step' => 1],
            ['id' => 'q3', 'type' => 'text', 'label' => 'Name', 'step' => 1],
        ],
    ]);

    expect($form->totalPoints())->toBe(30);
});

it('casts fields and settings as arrays', function () {
    $form = Form::factory()->create();

    expect($form->fields)->toBeArray()
        ->and($form->settings)->toBeArray();
});

it('casts boolean fields correctly', function () {
    $form = Form::factory()->create([
        'is_published' => true,
        'is_multi_step' => false,
        'allows_anonymous' => true,
    ]);

    expect($form->is_published)->toBeBool()->toBeTrue()
        ->and($form->is_multi_step)->toBeBool()->toBeFalse()
        ->and($form->allows_anonymous)->toBeBool()->toBeTrue();
});

it('returns default confirmation message', function () {
    $form = Form::factory()->create([
        'settings' => ['confirmation_message' => 'We got your response!'],
    ]);

    expect($form->getConfirmationMessage())->toBe('We got your response!');
});

it('uses route key name of slug', function () {
    $form = new Form;

    expect($form->getRouteKeyName())->toBe('slug');
});
