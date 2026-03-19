<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Shipment_Request', function (Blueprint $table) {
            $table->increments('shipmentRequestID');
            $table->integer('rate_request_id')->nullable();

            // Status & audit
            $table->string('request_status', 50)->nullable();
            $table->string('created_user_id')->nullable();
            $table->string('created_user_name')->nullable();
            $table->string('created_user_mail')->nullable();
            $table->dateTime('created_date_time')->nullable();
            $table->string('approver_user_id')->nullable();
            $table->string('approver_user_name')->nullable();
            $table->string('approver_user_mail')->nullable();
            $table->dateTime('approver_approved_date_time')->nullable();
            $table->dateTime('approver_rejected_date_time')->nullable();
            $table->text('remark')->nullable();
            $table->integer('history_count')->default(0);

            // Shipment details
            $table->string('topic')->nullable();
            $table->string('other_topic')->nullable();
            $table->string('po_number')->nullable();
            $table->text('service_options')->nullable();
            $table->text('urgent_reason')->nullable();
            $table->date('due_date')->nullable();

            // Pickup
            $table->string('pick_up_status', 50)->nullable();
            $table->date('pick_up_date')->nullable();
            $table->string('pick_up_start_time', 20)->nullable();
            $table->string('pick_up_end_time', 20)->nullable();
            $table->text('pick_up_instructions')->nullable();
            $table->string('pick_up_created_status', 50)->nullable();
            $table->string('pick_up_created_id')->nullable();
            $table->text('pick_up_confirmation_numbers')->nullable();
            $table->text('pick_up_error_msg')->nullable();

            // Charges & label
            $table->text('detailed_charges')->nullable();
            $table->string('label_status', 50)->nullable();
            $table->text('tracking_numbers')->nullable();
            $table->text('error_msg')->nullable();
            $table->text('label_error_msg')->nullable();
            $table->string('label_id')->nullable();

            // Customs
            $table->string('customs_purpose', 100)->nullable();
            $table->string('customs_terms_of_trade', 50)->nullable();
            $table->string('payment_terms', 100)->nullable();

            // Insurance
            $table->boolean('insurance_enabled')->default(false);
            $table->decimal('insurance_insured_value_amount', 15, 2)->nullable();
            $table->string('insurance_insured_value_currency', 10)->nullable();

            // Files
            $table->text('files_label_url')->nullable();
            $table->text('files_invoice_url')->nullable();
            $table->text('files_packing_slip')->nullable();

            // Misc
            $table->string('shipment_scope_type', 50)->nullable();
            $table->string('active', 10)->default('1');
            $table->string('invoice_no')->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('invoice_due_date')->nullable();
            $table->string('sales_person')->nullable();
            $table->date('shipment_date')->nullable();
            $table->date('po_date')->nullable();
            $table->string('send_to')->nullable();
            $table->decimal('grab_rate_amount', 15, 2)->nullable();
            $table->string('grab_rate_currency', 10)->nullable();
            $table->string('recipient_shipper_account_number')->nullable();
            $table->string('recipient_shipper_account_country_code', 5)->nullable();
            $table->string('billing', 50)->nullable();
            $table->text('customize_invoice_url')->nullable();
            $table->boolean('use_customize_invoice')->default(false);
            $table->boolean('return_shipment')->default(false);
            $table->string('paper_size', 20)->nullable();
            $table->text('shipping_options')->nullable();
            $table->boolean('testing')->default(false);
            $table->text('shipment_by_note')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Shipment_Request');
    }
};
