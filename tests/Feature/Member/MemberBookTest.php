<?php

use App\Models\BookLending;
use App\Models\User;

it('requires authentication to view my lendings', function () {
    $this->get(route('books.my-lendings'))
        ->assertRedirect(route('login'));
});

it('shows authenticated user lendings', function () {
    $user = User::factory()->create();
    BookLending::factory()->count(2)->create(['user_id' => $user->id]);
    BookLending::factory()->create(); // another user's lending

    $this->actingAs($user)
        ->get(route('books.my-lendings'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('member/library/my-lendings')
            ->has('lendings.data', 2)
        );
});

it('does not show other users lendings', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    BookLending::factory()->count(3)->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->get(route('books.my-lendings'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('lendings.data', 0)
        );
});
