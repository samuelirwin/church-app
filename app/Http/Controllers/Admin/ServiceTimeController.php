<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreServiceTimeRequest;
use App\Models\ServiceTime;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ServiceTimeController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('admin/service-times/create');
    }

    public function store(StoreServiceTimeRequest $request): RedirectResponse
    {
        $serviceTime = ServiceTime::create($request->validated());

        Log::info('Service time created', [
            'service_time_id' => $serviceTime->id,
            'name' => $serviceTime->name,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Service time \"{$serviceTime->name}\" created.");
    }

    public function edit(ServiceTime $serviceTime): Response
    {
        return Inertia::render('admin/service-times/edit', [
            'serviceTime' => $serviceTime,
        ]);
    }

    public function update(StoreServiceTimeRequest $request, ServiceTime $serviceTime): RedirectResponse
    {
        $serviceTime->update($request->validated());

        Log::info('Service time updated', [
            'service_time_id' => $serviceTime->id,
            'name' => $serviceTime->name,
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Service time \"{$serviceTime->name}\" updated.");
    }

    public function destroy(ServiceTime $serviceTime): RedirectResponse
    {
        if ($serviceTime->schedules()->exists()) {
            return redirect()->route('admin.site-settings.edit')
                ->with('error', "Cannot delete \"{$serviceTime->name}\" because it has associated schedules.");
        }

        $name = $serviceTime->name;
        $serviceTimeId = $serviceTime->id;

        $serviceTime->delete();

        Log::info('Service time deleted', [
            'service_time_id' => $serviceTimeId,
            'name' => $name,
        ]);

        return redirect()->route('admin.site-settings.edit')
            ->with('success', "Service time \"{$name}\" deleted.");
    }
}
