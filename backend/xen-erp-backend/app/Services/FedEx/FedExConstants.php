<?php

namespace App\Services\FedEx;

class FedExConstants
{
    // Payment Types
    public const PAYMENT_TYPE_SENDER = 'SENDER';

    // Label Response Options
    public const LABEL_RESPONSE_URL_ONLY = 'URL_ONLY';

    public const LABEL_RESPONSE_LABEL_BASE64 = 'LABEL';

    // Label Types
    public const LABEL_TYPE_PDF = 'PDF';

    public const IMAGE_TYPE_PDF = 'PDF';

    // Packaging Types
    public const PACKAGING_YOUR_PACKAGING = 'YOUR_PACKAGING';

    // Pickup Types
    public const PICKUP_USE_SCHEDULED = 'USE_SCHEDULED_PICKUP';

    public const PICKUP_SOURCE_CUSTOMER = 'CUSTOMER';

    public const PICKUP_REQUEST_SAME_DAY = 'SAME_DAY';

    public const PICKUP_REQUEST_FUTURE_DAY = 'FUTURE_DAY';

    public const PICKUP_LOCATION_FRONT = 'FRONT';

    public const PICKUP_BUILDING_ROOM = 'ROOM';

    // Paper Size Mapping
    public const PAPER_SIZE_MAP = [
        '4x6' => 'PAPER_4X6',
        'default' => 'STOCK_4X6', // for DYMO Label printer only support 4x6 labels
        // 'default' => 'PAPER_LETTER',
        'letter' => 'PAPER_LETTER',
        'a4' => 'PAPER_A4',
    ];

    // Carrier Codes
    public const CARRIER_FEDEX_EXPRESS = 'FDXE';

    public const CARRIER_FEDEX_GROUND = 'FDXG';

    // Express Service Types (for carrier code mapping)
    public const EXPRESS_SERVICES = [
        'INTERNATIONAL_PRIORITY',
        'INTERNATIONAL_ECONOMY',
        'PRIORITY_OVERNIGHT',
        'STANDARD_OVERNIGHT',
        'FIRST_OVERNIGHT',
        'FEDEX_2_DAY',
        'FEDEX_EXPRESS',
        'FEDEX_PRIORITY_EXPRESS',
        'FEDEX_PRIORITY',
    ];

    // Reference Types
    public const REFERENCE_TYPE_INVOICE = 'INVOICE_NUMBER';

    // Commodity Units
    public const QUANTITY_UNITS_PCS = 'PCS';

    // Field Character Limits (FedEx API Requirements)
    public const STREET_LINE_MAX_LENGTH = 35;

    public const ITEM_DESCRIPTION_MAX_LENGTH = 50;

    public const COMMODITY_DESCRIPTION_MAX_LENGTH = 50;

    public const COURIER_INSTRUCTIONS_MAX_LENGTH = 100;

    public const REMARKS_MAX_LENGTH = 255;

    public const BUILDING_DESCRIPTION_MAX_LENGTH = 50;

    // Timezone
    public const DEFAULT_TIMEZONE_OFFSET = '+07:00';

    // Invoice
    public const INVOICE_PREFIX_FEDEX = 'FEDEX-';

    public const INVOICE_DUE_DAYS = 30;

    // Shipment Scope Types
    public const SCOPE_DOMESTIC = 'domestic';

    public const SCOPE_INTERNATIONAL = 'international';

    public const LABEL_STATUS_CANCELLED = 'cancelled';

    public const FEDEX_DELETE_ALL_PACKAGES = 'DELETE_ALL_PACKAGES';
}
