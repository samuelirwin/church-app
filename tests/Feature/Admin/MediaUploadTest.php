<?php

use App\Models\Speaker;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

it('uploads a photo when creating a speaker', function () {
    $staff = User::factory()->staff()->create();
    $file = UploadedFile::fake()->image('photo.jpg', 400, 400);

    $this->actingAs($staff)
        ->post(route('admin.speakers.store'), [
            'name' => 'Test Speaker',
            'photo_image' => $file,
        ])
        ->assertRedirect(route('admin.speakers.index'));

    $speaker = Speaker::first();
    expect($speaker->getFirstMediaUrl('photo'))->not->toBeEmpty();
    expect($speaker->getFirstMedia('photo')->mime_type)->toBe('image/jpeg');
});

it('replaces a photo when editing a speaker', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();
    $speaker->addMedia(UploadedFile::fake()->image('old.jpg'))
        ->toMediaCollection('photo');

    $newFile = UploadedFile::fake()->image('new.png', 200, 200);

    $this->actingAs($staff)
        ->post(route('admin.speakers.update', $speaker), [
            '_method' => 'PUT',
            'name' => $speaker->name,
            'photo_image' => $newFile,
        ])
        ->assertRedirect(route('admin.speakers.index'));

    $speaker->refresh();
    expect($speaker->getMedia('photo'))->toHaveCount(1);
    expect($speaker->getFirstMedia('photo')->file_name)->toBe('new.png');
});

it('removes a photo when editing a speaker', function () {
    $staff = User::factory()->staff()->create();
    $speaker = Speaker::factory()->create();
    $speaker->addMedia(UploadedFile::fake()->image('photo.jpg'))
        ->toMediaCollection('photo');

    expect($speaker->getFirstMediaUrl('photo'))->not->toBeEmpty();

    $this->actingAs($staff)
        ->post(route('admin.speakers.update', $speaker), [
            '_method' => 'PUT',
            'name' => $speaker->name,
            'remove_photo' => true,
        ])
        ->assertRedirect(route('admin.speakers.index'));

    $speaker->refresh();
    expect($speaker->getFirstMediaUrl('photo'))->toBeEmpty();
});

it('rejects non-image files for speaker photo', function () {
    $staff = User::factory()->staff()->create();
    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $this->actingAs($staff)
        ->post(route('admin.speakers.store'), [
            'name' => 'Test Speaker',
            'photo_image' => $file,
        ])
        ->assertSessionHasErrors('photo_image');
});

it('rejects files over 10MB', function () {
    $staff = User::factory()->staff()->create();
    $file = UploadedFile::fake()->image('huge.jpg')->size(11000);

    $this->actingAs($staff)
        ->post(route('admin.speakers.store'), [
            'name' => 'Test Speaker',
            'photo_image' => $file,
        ])
        ->assertSessionHasErrors('photo_image');
});

it('denies unauthenticated users from uploading', function () {
    $file = UploadedFile::fake()->image('photo.jpg');

    $this->post(route('admin.speakers.store'), [
        'name' => 'Test Speaker',
        'photo_image' => $file,
    ])->assertRedirect(route('login'));
});

it('denies members from uploading media', function () {
    $member = User::factory()->create();
    $file = UploadedFile::fake()->image('photo.jpg');

    $this->actingAs($member)
        ->post(route('admin.speakers.store'), [
            'name' => 'Test Speaker',
            'photo_image' => $file,
        ])
        ->assertForbidden();
});

it('uploads avatar on profile update', function () {
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('avatar.png', 200, 200);

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $file,
        ])
        ->assertRedirect(route('profile.edit'));

    $user->refresh();
    expect($user->getFirstMediaUrl('avatar'))->not->toBeEmpty();
});

it('removes avatar on profile update', function () {
    $user = User::factory()->create();
    $user->addMedia(UploadedFile::fake()->image('avatar.jpg'))
        ->toMediaCollection('avatar');

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'remove_avatar' => true,
        ])
        ->assertRedirect(route('profile.edit'));

    $user->refresh();
    expect($user->getFirstMediaUrl('avatar'))->toBeEmpty();
});
