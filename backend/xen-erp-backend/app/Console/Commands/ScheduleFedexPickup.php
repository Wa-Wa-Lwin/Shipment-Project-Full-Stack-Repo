<?php

namespace App\Console\Commands;

use App\Http\Controllers\Logistic\CreatePickupController;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;

class ScheduleFedexPickup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fedex:schedule-pickup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically schedule FedEx pickups for tomorrow (FedEx only allows pickup for today and tomorrow)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting FedEx automated pickup scheduling...');

        try {
            // Resolve controller from the container so any dependencies are injected
            $controller = app(CreatePickupController::class);
            $response = $controller->automateSchedulePickup();
            $data = json_decode($response->getContent(), true);

            if ($response->getStatusCode() === 200) {
                $results = $data['results'];
                $this->info("✓ Found {$results['total_found']} FedEx shipments for tomorrow");
                $this->info("✓ Processed: {$results['processed']}");
                $this->info("✓ Success: {$results['success']}");

                if ($results['failed'] > 0) {
                    $this->warn("✗ Failed: {$results['failed']}");
                }

                if (! empty($results['details'])) {
                    $this->newLine();
                    $this->info('Details:');
                    foreach ($results['details'] as $detail) {
                        $icon = $detail['status'] === 'success' ? '✓' : '✗';
                        $this->line("{$icon} Shipment #{$detail['shipment_request_id']}: {$detail['message']}");
                    }
                }

                $this->newLine();
                $this->info('FedEx automated pickup scheduling completed successfully!');

                return SymfonyCommand::SUCCESS;
            } else {
                $this->error('Failed to schedule FedEx pickups: '.($data['message'] ?? 'Unknown error'));

                return SymfonyCommand::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error('Exception occurred: '.$e->getMessage());

            return SymfonyCommand::FAILURE;
        }
    }
}
