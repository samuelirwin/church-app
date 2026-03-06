<?php

use App\Models\Form;
use App\Models\FormResponse;
use App\Models\User;

it('denies member access to form listing', function () {
    $member = User::factory()->create();

    $this->actingAs($member)
        ->get(route('admin.forms.index'))
        ->assertForbidden();
});

it('allows staff to view form listing', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.forms.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/index')
            ->has('forms')
            ->has('filters')
        );
});

it('shows the create form page', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->get(route('admin.forms.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/create')
        );
});

it('creates a form with valid data', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.forms.store'), [
            'title' => 'Visitor Registration',
            'description' => '<p>Register as a visitor.</p>',
            'fields' => [
                ['id' => 'f1', 'type' => 'text', 'label' => 'Full Name', 'required' => true],
                ['id' => 'f2', 'type' => 'email', 'label' => 'Email', 'required' => true],
            ],
            'is_published' => true,
        ])
        ->assertRedirect();

    expect(Form::where('title', 'Visitor Registration')->exists())->toBeTrue();
});

it('validates required fields when creating a form', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.forms.store'), [])
        ->assertSessionHasErrors(['title', 'fields']);
});

it('validates field structure', function () {
    $staff = User::factory()->staff()->create();

    $this->actingAs($staff)
        ->post(route('admin.forms.store'), [
            'title' => 'Test Form',
            'fields' => [
                ['id' => 'f1', 'type' => 'invalid_type', 'label' => 'Test'],
            ],
        ])
        ->assertSessionHasErrors(['fields.0.type']);
});

it('shows the edit form page', function () {
    $staff = User::factory()->staff()->create();
    $form = Form::factory()->create();

    $this->actingAs($staff)
        ->get(route('admin.forms.edit', $form))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/edit')
            ->has('form')
        );
});

it('updates a form', function () {
    $staff = User::factory()->staff()->create();
    $form = Form::factory()->create();

    $this->actingAs($staff)
        ->put(route('admin.forms.update', $form), [
            'title' => 'Updated Form Title',
            'fields' => [
                ['id' => 'f1', 'type' => 'text', 'label' => 'Name'],
            ],
        ])
        ->assertRedirect(route('admin.forms.index'));

    expect($form->fresh()->title)->toBe('Updated Form Title');
});

it('deletes a form', function () {
    $staff = User::factory()->staff()->create();
    $form = Form::factory()->create();

    $this->actingAs($staff)
        ->delete(route('admin.forms.destroy', $form))
        ->assertRedirect(route('admin.forms.index'));

    expect(Form::find($form->id))->toBeNull();
});

it('searches forms by title', function () {
    $staff = User::factory()->staff()->create();
    Form::factory()->create(['title' => 'Visitor Card']);
    Form::factory()->create(['title' => 'Prayer Request']);

    $this->actingAs($staff)
        ->get(route('admin.forms.index', ['search' => 'Visitor']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('forms.data', 1)
        );
});

it('filters forms by published status', function () {
    $staff = User::factory()->staff()->create();
    Form::factory()->published()->create();
    Form::factory()->unpublished()->create();

    $this->actingAs($staff)
        ->get(route('admin.forms.index', ['status' => 'published']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('forms.data', 1)
        );
});

it('displays form responses page', function () {
    $staff = User::factory()->staff()->create();
    $form = Form::factory()->create();
    FormResponse::factory()->count(3)->create(['form_id' => $form->id]);

    $this->actingAs($staff)
        ->get(route('admin.forms.responses', $form))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/responses')
            ->has('form')
            ->has('responses.data', 3)
        );
});
