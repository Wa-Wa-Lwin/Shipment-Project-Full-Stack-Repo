<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('exchange-rates:update')->hourly();

// FedEx automated pickup scheduling
// Runs daily at 10:00 AM to schedule pickups for tomorrow
// FedEx only allows pickup booking for today and tomorrow
Schedule::command('fedex:schedule-pickup')
    ->dailyAt('10:00')
    ->timezone('Asia/Bangkok')
    ->withoutOverlapping()
    ->runInBackground();

// FedEx automated label creation scheduling
// Runs daily at 08:00 AM to create labels for shipments with ship_date > 10 days in future
// This prevents labels from being created too early when they may expire (typically 120 days validity)
Schedule::command('fedex:schedule-label-creation')
    ->dailyAt('08:00')
    ->timezone('Asia/Bangkok')
    ->withoutOverlapping()
    ->runInBackground();
