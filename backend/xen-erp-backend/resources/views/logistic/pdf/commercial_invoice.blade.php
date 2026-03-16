<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Invoice {{ $shipment['shipmentRequestID'] ?? '' }}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }

        .page {
            page-break-after: always;
            position: relative;
            min-height: 267mm; /* A4 height minus margins */
        }

        .page:last-child {
            page-break-after: avoid;
        }

        .header {
            margin-bottom: 10px;
        }

        .header-row {
            display: table;
            width: 100%;
        }

        .logo-section {
            display: table-cell;
            width: 60%;
            vertical-align: top;
        }

        .logo-section img {
            width: 250px;
            height: auto;
        }

        .invoice-info {
            display: table-cell;
            width: 40%;
            text-align: right;
            vertical-align: top;
        }

        .invoice-info p {
            margin: 3px 0;
            font-size: 11px;
        }

        .invoice-info .invoice-number {
            font-weight: bold;
            font-size: 13px;
        }

        .addresses {
            margin-bottom: 10px;
        }

        .addresses-table {
            width: 100%;
            border-collapse: collapse;
        }

        .addresses-table td {
            vertical-align: top;
            padding: 8px;
            font-size: 9px;
        }

        .addresses-table .shipper {
            width: 40%;
        }

        .addresses-table .bill-to,
        .addresses-table .delivery-to {
            width: 30%;
        }

        .address-title {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 10px;
        }

        .items-table th,
        .items-table td {
            border: 1px solid #ccc;
            padding: 5px;
        }

        .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: left;
        }

        .items-table .col-no {
            width: 25px;
            text-align: center;
        }

        .items-table .col-material {
            width: 100px;
        }

        .items-table .col-description {
            width: auto;
        }

        .items-table .col-hs {
            width: 60px;
            text-align: center;
        }

        .items-table .col-qty {
            width: 30px;
            text-align: center;
        }

        .items-table .col-price,
        .items-table .col-amount {
            width: 65px;
            text-align: right;
        }

        .continuation {
            text-align: right;
            font-style: italic;
            margin-top: 5px;
            font-size: 11px;
        }

        .summary-section {
            display: table;
            width: 100%;
            margin-top: 10px;
        }

        .terms-box {
            display: table-cell;
            width: 60%;
            vertical-align: top;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: 1px solid black;
            padding: 10px;
            font-size: 9px;
        }

        .totals-box {
            display: table-cell;
            width: 40%;
            vertical-align: top;
            border: 1px solid black;
            padding: 10px;
        }

        .totals-table {
            width: 100%;
            font-size: 10px;
        }

        .totals-table td {
            padding: 4px 0;
        }

        .totals-table .total-row {
            border-top: 2px solid black;
            font-weight: bold;
        }

        .totals-table .amount {
            text-align: right;
        }

        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #ccc;
            padding-top: 5px;
        }
    </style>
</head>
<body>
@php
    // Helper functions
    $formatDate = function($dateString) {
        if (empty($dateString)) return '';
        try {
            return \Carbon\Carbon::parse($dateString)->format('Y-m-d');
        } catch (\Exception $e) {
            return $dateString;
        }
    };

    $isXenoptics = function($companyName) {
        return str_starts_with(strtolower($companyName ?? ''), 'xenoptics');
    };

    // Get all items from all parcels
    $allItems = collect($shipment['parcels'] ?? [])->flatMap(function($parcel) {
        return $parcel['items'] ?? [];
    })->values()->all();

    // Calculate totals
    $subtotal = collect($allItems)->sum(function($item) {
        return (float)($item['quantity'] ?? 0) * (float)($item['price_amount'] ?? 0);
    });
    $taxTotal = 0;
    $grandTotal = $subtotal + $taxTotal;

    // Get currency
    $currency = $allItems[0]['price_currency'] ?? 'THB';

    // Check FOC
    $isFOC = strtolower($shipment['payment_terms'] ?? '') === 'free_of_charge';

    // Pagination - 10 items per page
    $itemsPerPage = 10;
    $itemPages = array_chunk($allItems, $itemsPerPage);
    $totalPages = count($itemPages) ?: 1;
@endphp

@foreach($itemPages as $pageIndex => $pageItems)
@php
    $isLastPage = ($pageIndex === $totalPages - 1);
    $startItemNumber = $pageIndex * $itemsPerPage;
@endphp
<div class="page">
    <!-- Header -->
    <div class="header">
        <div class="header-row">
            <div class="logo-section">
                <img src="{{ public_path('images/xenoptics_logo_full.PNG') }}" alt="Xenoptics Logo">
            </div>
            <div class="invoice-info">
                <p class="invoice-number">Invoice No: {{ $shipment['invoice_no'] ?? '' }}</p>
                <p><strong>Date:</strong> {{ !empty($shipment['invoice_date']) ? $formatDate($shipment['invoice_date']) : \Carbon\Carbon::now()->format('Y-m-d') }}</p>
                <p><strong>Due Date:</strong> {{ !empty($shipment['invoice_due_date']) ? $formatDate($shipment['invoice_due_date']) : \Carbon\Carbon::now()->addDays(30)->format('Y-m-d') }}</p>
                @if(($shipment['topic'] ?? '') === 'For Sales')
                <p>
                    <strong>Sales Person:</strong>
                    @if($isXenoptics($shipment['ship_from']['company_name'] ?? ''))
                        {{ $shipment['sales_person'] ?? 'Nati Neuberger' }}
                    @else
                        {{ $shipment['ship_from']['contact_name'] ?? '' }}
                    @endif
                </p>
                @endif
            </div>
        </div>
    </div>

    <!-- Addresses -->
    <div class="addresses">
        <table class="addresses-table">
            <tr>
                <!-- Shipper / Exporter -->
                <td class="shipper">
                    <div class="address-title">Shipper / Exporter:</div>
                    @if($isXenoptics($shipment['ship_from']['company_name'] ?? ''))
                        <strong>Xenoptics Limited.</strong><br>
                        195 Moo.3 Bypass Chiangmai-Hangdong<br>
                        T. Namphrae, A. Hang Dong, Chiang Mai 50230<br>
                        Thailand<br>
                        Tel: +66 52081400<br>
                        Email: info@xenoptics.com
                    @else
                        <strong>{{ $shipment['ship_from']['company_name'] ?? '' }}</strong><br>
                        @if(!empty($shipment['ship_from']['street1'])){{ $shipment['ship_from']['street1'] }}<br>@endif
                        @if(!empty($shipment['ship_from']['street2'])){{ $shipment['ship_from']['street2'] }}<br>@endif
                        @if(!empty($shipment['ship_from']['street3'])){{ $shipment['ship_from']['street3'] }}<br>@endif
                        {{ $shipment['ship_from']['city'] ?? '' }}, {{ $shipment['ship_from']['state'] ?? '' }} {{ $shipment['ship_from']['postal_code'] ?? '' }}<br>
                        {{ $shipment['ship_from']['country'] ?? '' }}<br>
                        Tel: {{ $shipment['ship_from']['phone'] ?? '' }}<br>
                        Email: {{ $shipment['ship_from']['email'] ?? '' }}<br>
                        Contact: {{ $shipment['ship_from']['contact_name'] ?? '' }}
                    @endif
                </td>

                <!-- Bill To -->
                <td class="bill-to">
                    <div class="address-title">Bill To:</div>
                    <strong>{{ $shipment['ship_to']['company_name'] ?? '' }}</strong><br>
                    @if(!empty($shipment['ship_to']['street1'])){{ $shipment['ship_to']['street1'] }}<br>@endif
                    @if(!empty($shipment['ship_to']['street2'])){{ $shipment['ship_to']['street2'] }}<br>@endif
                    @if(!empty($shipment['ship_to']['street3'])){{ $shipment['ship_to']['street3'] }}<br>@endif
                    {{ $shipment['ship_to']['city'] ?? '' }}, {{ $shipment['ship_to']['state'] ?? '' }} {{ $shipment['ship_to']['postal_code'] ?? '' }}<br>
                    {{ $shipment['ship_to']['country'] ?? '' }}<br>
                    Tel: {{ $shipment['ship_to']['phone'] ?? '' }}<br>
                    Email: {{ $shipment['ship_to']['email'] ?? '' }}<br>
                    Contact: {{ $shipment['ship_to']['contact_name'] ?? '' }}
                </td>

                <!-- Delivery To -->
                <td class="delivery-to">
                    <div class="address-title">Delivery To:</div>
                    <strong>{{ $shipment['ship_to']['company_name'] ?? '' }}</strong><br>
                    @if(!empty($shipment['ship_to']['street1'])){{ $shipment['ship_to']['street1'] }}<br>@endif
                    @if(!empty($shipment['ship_to']['street2'])){{ $shipment['ship_to']['street2'] }}<br>@endif
                    @if(!empty($shipment['ship_to']['street3'])){{ $shipment['ship_to']['street3'] }}<br>@endif
                    {{ $shipment['ship_to']['city'] ?? '' }}, {{ $shipment['ship_to']['state'] ?? '' }} {{ $shipment['ship_to']['postal_code'] ?? '' }}<br>
                    {{ $shipment['ship_to']['country'] ?? '' }}<br>
                    Tel: {{ $shipment['ship_to']['phone'] ?? '' }}<br>
                    Email: {{ $shipment['ship_to']['email'] ?? '' }}<br>
                    Contact: {{ $shipment['ship_to']['contact_name'] ?? '' }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th class="col-no">No.</th>
                <th class="col-material">Material Code</th>
                <th class="col-description">Description</th>
                <th class="col-hs">HS Code</th>
                <th class="col-qty">Qty</th>
                <th class="col-price">Unit Price<br>({{ $currency }})</th>
                <th class="col-amount">Amount<br>({{ $currency }})</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pageItems as $idx => $item)
            <tr>
                <td class="col-no">{{ $startItemNumber + $idx + 1 }}</td>
                <td class="col-material">{{ $item['material_code'] ?? $item['sku'] ?? '' }}</td>
                <td class="col-description">{{ $item['description'] ?? '' }}</td>
                <td class="col-hs">{{ $item['hs_code'] ?? '-' }}</td>
                <td class="col-qty">{{ $item['quantity'] ?? '' }}</td>
                <td class="col-price">{{ number_format((float)($item['price_amount'] ?? 0), 2) }}</td>
                <td class="col-amount">{{ number_format((float)($item['quantity'] ?? 0) * (float)($item['price_amount'] ?? 0), 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($totalPages > 1)
    <div class="continuation">
        @if($isLastPage)
            <strong>Last Page</strong>
        @else
            To be continued...
        @endif
    </div>
    @endif

    <!-- Summary and Terms - Only on last page -->
    @if($isLastPage)
    <div class="summary-section">
        <div class="terms-box">
            @if($isFOC)
                <strong>Purpose of Shipment: </strong>{{ strtoupper($shipment['customs_purpose'] ?? '') }}<br><br>
                <strong>Incoterm:</strong> {{ strtoupper($shipment['customs_terms_of_trade'] ?? '') }}<br><br>
                NO COMMERCIAL VALUE, "VALUE FOR CUSTOMS PURPOSE ONLY"<br><br>
                This is to certify that the above named materials are properly classified,
                described, marked, labeled and in good order and condition for transportation.
            @else
                <strong>Customer PO No.</strong> {{ $shipment['po_number'] ?? '' }}<br>
                <strong>PO Date:</strong> {{ $shipment['po_date'] ?? '' }}<br>
                <strong>Incoterm:</strong> {{ strtoupper($shipment['customs_terms_of_trade'] ?? '') }}<br><br>
                @if(str_contains(strtolower($shipment['shipment_scope_type'] ?? ''), 'import'))
                    <strong>Bank Details</strong><br>
                    <strong>Please make all cheques and EFT payable To:</strong> Xenoptics Limited.<br>
                    <strong>For Overseas customers:</strong> Bangkok Bank Public Company Limited<br>
                    <strong>Bank Account No:</strong> 8401010019125962501<br>
                    <strong>Bank SWIFT Code:</strong> BKKBTHBKXX<br>
                    <strong>Payment:</strong> {{ number_format($grandTotal, 2) }} ({{ $currency }})<br>
                    <strong>Due Date:</strong> {{ $formatDate($shipment['invoice_due_date'] ?? '') }}
                @endif
            @endif
        </div>

        <div class="totals-box">
            <table class="totals-table">
                <tr>
                    <td><strong>Sub Total ({{ $currency }})</strong></td>
                    <td class="amount">{{ number_format($subtotal, 2) }}</td>
                </tr>
                <tr>
                    <td><strong>Tax Total ({{ $currency }})</strong></td>
                    <td class="amount">{{ number_format($taxTotal, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total ({{ $currency }})</strong></td>
                    <td class="amount">{{ number_format($grandTotal, 2) }}</td>
                </tr>
            </table>
        </div>
    </div>
    @endif

    <!-- Footer -->
    <div class="footer">
        <div>Page {{ $pageIndex + 1 }} of {{ $totalPages }}</div>
        <div>Xenoptics Ltd. All rights reserved.</div>
    </div>
</div>
@endforeach
</body>
</html>
