# FedEx Automated Pickup Scheduling

## Overview

FedEx has a restriction that pickups can only be booked for **today** or **tomorrow**. This automated system ensures that FedEx pickups are scheduled exactly one day in advance.

## How It Works

The system automatically schedules FedEx pickups every day at **10:00 AM (Bangkok timezone)** for shipments with pickup dates set to **tomorrow**.

### Selection Criteria

The automated scheduler will process shipment requests that meet ALL of the following conditions:

1. **Pickup Date**: Set to tomorrow's date
2. **Carrier**: FedEx is the chosen rate (`shipper_account_slug = 'fedex'`)
3. **Label Status**: `created` (label must be created first)
4. **Pickup Status**: `pick_up_status = true`
5. **Pickup Creation Status**: NOT `created_success` (or NULL)

## Components

### 1. Controller Method
**Location**: `app/Http/Controllers/Logistic/CreateLabelController.php`

**Method**: `automateSchedulePickup()`

This method:
- Queries all eligible FedEx shipments for tomorrow
- Calls the existing `createPickup()` method for each shipment
- Logs results and returns a summary

### 2. Laravel Command
**Location**: `app/Console/Commands/ScheduleFedexPickup.php`

**Command**: `php artisan fedex:schedule-pickup`

Run manually:
```bash
php artisan fedex:schedule-pickup
```

### 3. Scheduled Task
**Location**: `routes/console.php`

**Schedule**: Daily at 10:00 AM (Asia/Bangkok timezone)

The scheduler configuration:
```php
Schedule::command('fedex:schedule-pickup')
    ->dailyAt('10:00')
    ->timezone('Asia/Bangkok')
    ->withoutOverlapping()
    ->runInBackground();
```

### 4. API Endpoint
**Endpoint**: `POST /api/logistics/automate_schedule_pickup`

**Location**: `routes/Logistic/action_shipment_request.php`

This endpoint allows manual triggering of the automated pickup scheduling:
```bash
curl -X POST http://your-domain/api/logistics/automate_schedule_pickup
```

## Monitoring

### Command Line
Run the command manually to see output:
```bash
php artisan fedex:schedule-pickup
```

Example output:
```
Starting FedEx automated pickup scheduling...
✓ Found 3 FedEx shipments for tomorrow
✓ Processed: 3
✓ Success: 2
✗ Failed: 1

Details:
✓ Shipment #1234: Pickup created successfully
✓ Shipment #1235: Pickup created successfully
✗ Shipment #1236: Pickup creation failed - Label not created

FedEx automated pickup scheduling completed successfully!
```

### Logs
Check Laravel logs for automated execution:
```bash
tail -f storage/logs/laravel.log | grep "FedEx Automated Pickup"
```

### Scheduler Status
View all scheduled tasks:
```bash
php artisan schedule:list
```

## Production Setup

### Cron Job
Ensure the Laravel scheduler is running by adding this to your crontab:

```bash
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

This single cron entry will run all scheduled tasks including the FedEx pickup automation.

### Verify Cron
Check if cron is running:
```bash
crontab -l
```

## Troubleshooting

### No Pickups Being Created
1. Check if shipments meet all selection criteria
2. Verify `pick_up_date` is set to tomorrow
3. Ensure `label_status` is `created`
4. Check FedEx is the chosen carrier
5. Review logs: `storage/logs/laravel.log`

### Manual Execution
If the scheduler fails, you can manually trigger:
```bash
php artisan fedex:schedule-pickup
```

Or via API:
```bash
curl -X POST http://your-domain/api/logistics/automate_schedule_pickup
```

## Database Fields Referenced

- `shipment_request.pick_up_date` - Pickup date
- `shipment_request.pick_up_status` - Pickup enabled flag
- `shipment_request.label_status` - Must be 'created'
- `shipment_request.pick_up_created_status` - Current pickup status
- `rate.chosen` - Must be '1'
- `rate.shipper_account_slug` - Must be 'fedex'

## Notes

- **FedEx Restriction**: Pickups can only be booked for today or tomorrow
- **Timing**: Runs at 10:00 AM to allow sufficient time for same-day bookings
- **Overlap Protection**: `withoutOverlapping()` prevents concurrent executions
- **Background Execution**: Runs in background to avoid blocking other tasks
- **Timezone**: Asia/Bangkok (adjust in `routes/console.php` if needed)
