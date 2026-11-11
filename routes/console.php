<?php

use App\Jobs\DetectAbsentMembers;
use App\Jobs\MarkCurrentWeekSermon;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new MarkCurrentWeekSermon)->weeklyOn(1, '01:00')
    ->withoutOverlapping()
    ->onOneServer();

Schedule::job(new DetectAbsentMembers)->weeklyOn(1, '06:00')
    ->withoutOverlapping()
    ->onOneServer();
