<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreVolunteerRoleRequest;
use App\Models\Ministry;
use App\Models\VolunteerRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class VolunteerRoleController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('admin/volunteer-roles/create', [
            'ministries' => Ministry::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreVolunteerRoleRequest $request): RedirectResponse
    {
        $role = VolunteerRole::create($request->validated());

        Log::info('Volunteer role created', [
            'role_id' => $role->id,
            'name' => $role->name,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Volunteer role \"{$role->name}\" created.");
    }

    public function edit(VolunteerRole $volunteerRole): Response
    {
        return Inertia::render('admin/volunteer-roles/edit', [
            'role' => $volunteerRole->load('ministry'),
            'ministries' => Ministry::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(StoreVolunteerRoleRequest $request, VolunteerRole $volunteerRole): RedirectResponse
    {
        $volunteerRole->update($request->validated());

        Log::info('Volunteer role updated', [
            'role_id' => $volunteerRole->id,
            'name' => $volunteerRole->name,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Volunteer role \"{$volunteerRole->name}\" updated.");
    }

    public function destroy(VolunteerRole $volunteerRole): RedirectResponse
    {
        $name = $volunteerRole->name;
        $roleId = $volunteerRole->id;

        $volunteerRole->delete();

        Log::info('Volunteer role deleted', [
            'role_id' => $roleId,
            'name' => $name,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Volunteer role \"{$name}\" deleted.");
    }
}
