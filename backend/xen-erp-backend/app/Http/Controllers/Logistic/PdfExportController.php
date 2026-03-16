<?php

namespace App\Http\Controllers\Logistic;

use App\Models\Logistic\ShipmentRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class PdfExportController
{
    /**
     * Generate and save a commercial invoice PDF for a shipment
     * This is used by CreateLabelController to generate custom invoices for AfterShip
     *
     * @param  int  $id  Shipment Request ID
     * @return array ['success' => bool, 'path' => string|null, 'base64' => string|null, 'error' => string|null]
     */
    public function generateAndSaveCommercialInvoice($id): array
    {
        try {
            $shipmentRequest = ShipmentRequest::with(
                'shipmentRequestHistories',
                'parcels.items',
                'shipTo',
                'shipFrom',
                'rates',
                'invoiceDatas'
            )->find($id);

            if (! $shipmentRequest) {
                return [
                    'success' => false,
                    'path' => null,
                    'base64' => null,
                    'error' => 'Shipment Request not found',
                ];
            }

            // Set invoice_date to the approver's approval date, due date to +30 days
            $approvalDate = ! empty($shipmentRequest->approver_approved_date_time)
                ? Carbon::parse($shipmentRequest->approver_approved_date_time)->toDateString()
                : Carbon::now()->toDateString();

            $shipmentRequest->invoice_date = $approvalDate;
            $shipmentRequest->invoice_due_date = Carbon::parse($approvalDate)->addDays(30)->toDateString();
            $shipmentRequest->save();

            // Convert to array for Blade template
            $shipment = $shipmentRequest->toArray();

            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('logistic.pdf.commercial_invoice', compact('shipment'));
            $pdf->setPaper('A4', 'portrait');

            // Get PDF content
            $pdfContent = $pdf->output();

            // Generate filename based on shipment type
            $filename = $this->generateInvoiceFilename($shipmentRequest);

            // Save to public/uploads/invoices/
            $savePath = public_path('uploads/invoices/'.$filename);

            // Ensure directory exists
            if (! is_dir(dirname($savePath))) {
                mkdir(dirname($savePath), 0755, true);
            }

            // Save the file
            file_put_contents($savePath, $pdfContent);

            // Generate relative path for database storage
            $relativePath = 'uploads/invoices/'.$filename;

            Log::info('Commercial invoice PDF generated successfully', [
                'shipment_request_id' => $id,
                'filename' => $filename,
                'path' => $relativePath,
                'pdf_size' => strlen($pdfContent).' bytes',
            ]);

            return [
                'success' => true,
                'path' => $relativePath,
                'base64' => base64_encode($pdfContent),
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate commercial invoice PDF', [
                'shipment_request_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'path' => null,
                'base64' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Generate filename for invoice based on shipment type
     */
    private function generateInvoiceFilename(ShipmentRequest $shipmentRequest): string
    {
        $scope = strtolower($shipmentRequest->shipment_scope_type ?? '');
        $isFOC = strtolower($shipmentRequest->payment_terms ?? '') === 'free_of_charge';
        $id = $shipmentRequest->shipmentRequestID;
        $timestamp = time();

        if (str_starts_with($scope, 'domestic') && $isFOC) {
            $prefix = 'Domestic_Foc';
        } elseif (str_starts_with($scope, 'domestic')) {
            $prefix = 'Domestic';
        } elseif ($scope === 'international_export' && $isFOC) {
            $prefix = 'Export_Foc';
        } elseif ($scope === 'international_export') {
            $prefix = 'Export';
        } elseif ($scope === 'international_import' && $isFOC) {
            $prefix = 'Import_Foc';
        } elseif ($scope === 'international_import') {
            $prefix = 'Import';
        } elseif ($scope === 'international' && $isFOC) {
            $prefix = 'International_Foc';
        } elseif ($scope === 'international') {
            $prefix = 'International';
        } else {
            $prefix = 'Invoice';
        }

        return "{$prefix}_{$id}_{$timestamp}.pdf";
    }

    /**
     * Download commercial invoice PDF (forces download instead of inline view)
     * API endpoint: GET /invoice_pdf/download/{id}
     *
     * @param  int  $id  Shipment Request ID
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function downloadCommercialInvoice($id)
    {
        try {
            $shipmentRequest = ShipmentRequest::with(
                'shipmentRequestHistories',
                'parcels.items',
                'shipTo',
                'shipFrom',
                'rates',
                'invoiceDatas'
            )->find($id);

            if (! $shipmentRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shipment Request not found',
                    'shipment_request_id' => $id,
                ], 404);
            }

            // Set invoice_date to the approver's approval date, due date to +30 days
            $approvalDate = ! empty($shipmentRequest->approver_approved_date_time)
                ? Carbon::parse($shipmentRequest->approver_approved_date_time)->toDateString()
                : Carbon::now()->toDateString();

            $shipmentRequest->invoice_date = $approvalDate;
            $shipmentRequest->invoice_due_date = Carbon::parse($approvalDate)->addDays(30)->toDateString();

            // Convert to array for Blade template
            $shipment = $shipmentRequest->toArray();

            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('logistic.pdf.commercial_invoice', compact('shipment'));
            $pdf->setPaper('A4', 'portrait');

            // Generate filename
            $filename = $this->generateInvoiceFilename($shipmentRequest);

            Log::info('Commercial invoice PDF download requested', [
                'shipment_request_id' => $id,
                'filename' => $filename,
            ]);

            // Return PDF for download
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Failed to download commercial invoice PDF', [
                'shipment_request_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: '.$e->getMessage(),
                'shipment_request_id' => $id,
            ], 500);
        }
    }
}
