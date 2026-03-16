<?php

namespace App\Console\Commands;

use App\Services\ScheduleLabelCreationService;
use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;

class ScheduleFedexLabelCreation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fedex:schedule-label-creation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically create FedEx labels for shipments scheduled more than 10 days in the future';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting FedEx automated label creation scheduling...');

        try {
            // Resolve service from the container so any dependencies are injected
            $service = app(ScheduleLabelCreationService::class);
            $response = $service->automateScheduleLabelCreation();
            $data = json_decode($response->getContent(), true);

            if ($response->getStatusCode() === 200) {
                $results = $data['results'];
                $this->info("✓ Found {$results['total_found']} FedEx shipments with ship date > 10 days");
                $this->info("✓ Processed: {$results['processed']}");
                $this->info("✓ Success: {$results['success']}");

                if ($results['scheduled'] > 0) {
                    $this->line("⚙ Scheduled: {$results['scheduled']}");
                }

                if ($results['skipped'] > 0) {
                    $this->line("⊘ Skipped: {$results['skipped']}");
                }

                if ($results['failed'] > 0) {
                    $this->warn("✗ Failed: {$results['failed']}");
                }

                if (! empty($results['details'])) {
                    $this->newLine();
                    $this->info('Details:');
                    foreach ($results['details'] as $detail) {
                        $icon = match ($detail['status']) {
                            'success' => '✓',
                            'failed' => '✗',
                            'skipped' => '⊘',
                            'scheduled' => '⚙',
                            default => '•'
                        };
                        $this->line("{$icon} Shipment #{$detail['shipment_request_id']}: {$detail['message']}");
                    }
                }

                $this->newLine();
                $this->info('FedEx automated label creation scheduling completed successfully!');

                return SymfonyCommand::SUCCESS;
            } else {
                $this->error('Failed to schedule FedEx label creation: '.($data['message'] ?? 'Unknown error'));

                return SymfonyCommand::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error('Exception occurred: '.$e->getMessage());

            return SymfonyCommand::FAILURE;
        }
    }
}
