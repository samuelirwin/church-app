<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users for admin management.
     * Users are split into two tabs: staff (admin, staff, leader) and members.
     */
    public function index(Request $request): Response
    {
        $tab = $request->input('tab', 'staff');
        $staffRoles = [UserRole::Admin->value, UserRole::Staff->value, UserRole::Leader->value];

        $users = User::query()
            ->when($request->input('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($tab === 'staff', fn ($query) => $query->whereIn('role', $staffRoles))
            ->when($tab === 'members', fn ($query) => $query->where('role', UserRole::Member->value))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $staffCount = User::whereIn('role', $staffRoles)->count();
        $memberCount = User::where('role', UserRole::Member->value)->count();

        Log::info('Admin users listing viewed', [
            'admin_id' => $request->user()->id,
            'tab' => $tab,
            'search' => $request->input('search'),
        ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'tab']),
            'activeTab' => $tab,
            'staffCount' => $staffCount,
            'memberCount' => $memberCount,
        ]);
    }

    /**
     * Show the form for editing a user's role.
     */
    public function edit(User $user): Response
    {
        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'roles' => array_map(
                fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()],
                UserRole::cases(),
            ),
        ]);
    }

    /**
     * Update the user's role.
     */
    public function update(Request $request, User $user): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $oldRole = $user->role->value;
        $user->update($validated);

        Log::info('User role updated', [
            'admin_id' => $request->user()->id,
            'user_id' => $user->id,
            'old_role' => $oldRole,
            'new_role' => $validated['role'],
        ]);

        return redirect()->route('admin.users.index')
            ->with('success', "Role updated for {$user->name}.");
    }
}
