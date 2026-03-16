# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Laravel Artisan Commands
- `php artisan serve` - Start development server
- `php artisan serve --host=0.0.0.0 --port=8000` - Start server accessible from local network
- `php artisan migrate` - Run database migrations
- `php artisan config:clear && php artisan cache:clear && php artisan optimize:clear` - Clear all caches (use when getting 403 errors after config changes)
- `php artisan test` - Run PHPUnit tests
- `php artisan queue:listen --tries=1` - Process background jobs manually
- `php artisan fedex:schedule-pickup` - Manually trigger FedEx pickup scheduler
- `php artisan fedex:schedule-label-creation` - Manually trigger FedEx label creation scheduler

### Composer Commands
- `composer install` - Install PHP dependencies
- `composer dev` - Start full development environment (server + queue + logs + vite)
- `composer test` - Clear config and run tests
- `composer dump-autoload` - Regenerate autoload files (use after adding new classes)

### NPM Commands
- `npm run dev` - Start Vite development server
- `npm run build` - Build assets for production

### Testing
- Run tests with: `php artisan test` or `composer test`
- Test configuration is in `phpunit.xml`

## Architecture Overview

This is a Laravel 12 application serving as an ERP backend system with a focus on logistics management.

### Core Structure
- **Framework**: Laravel 12 with PHP 8.2+
- **Frontend**: Vite build system with TailwindCSS
- **Database**: SQL Server with multiple database connections (see Database Connections below)
- **Queue System**: Database-backed queue for background processing (`QUEUE_CONNECTION=database`)
- **Mail**: PHPMailer integration for email functionality
- **Cache**: Database-backed cache (`CACHE_STORE=database`)
- **Excel Export/Import**: Laravel Excel (Maatwebsite) for address list and data import/export

### Database Connections

The application connects to multiple SQL Server databases defined in `config/database.php`:

1. **sqlsrv** (default): Main Logistics database (`DB_DATABASE_LOGISTICS=Logistics`)
2. **sqlsrv_mfg**: Manufacturing database (`DB_DATABASE_MFG=MFG`)
3. **sqlsrv_xenapi_mfg**: XEN API Manufacturing database
4. **sqlsrv_xen_db**: XEN database (`DB_DATABASE_XEN_DB=XEN`)

Models specify their connection using `protected $connection = 'sqlsrv';` property. Most Logistic models use the default `sqlsrv` connection.

### Key Modules

#### Logistic Module (`app/Models/Logistic/` & `app/Http/Controllers/Logistic/`)
The main business logic module handling:

**Shipment Workflow**:
- `ShipmentRequest` - Core entity tracking shipment requests through their lifecycle
- `ShipmentRequestHistory` - Audit trail of all changes to shipment requests
- Request statuses: `requestor_requested` → `request_to_logistic` → `logistic_updated` → `approver_approved` | `approver_rejected`
- Label statuses: `scheduled`, `created`, `failed`

**Rate Management**:
- `RateRequest` - Stores rate quote requests
- `Rate` - Individual carrier rate options returned from rate APIs
- Rate calculation supports multiple carriers (FedEx, DHL, etc.)

**Address Management**:
- `AddressList` - Central address book (uses `Address_List` table)
- `ShipFrom`, `ShipTo`, `BillTo` - Shipment-specific address entities
- Address synchronization from external XEN database

**Package & Commodity**:
- `Parcel` - Package/box information
- `ParcelItem` - Individual items within parcels
- `Commodity` - Customs/commercial invoice line items
- `Packaging` - Package type definitions
- `ParcelBoxTypes` - Available box types with dimensions

**Supporting Entities**:
- `User`, `UserList` - User management
- `RequestTopic` - Categorization of shipment requests
- `ShipperAccount` - Carrier account credentials
- `InvoiceData` - Commercial invoice information
- `DHLEcommerceDomesticRateList` - DHL domestic rate tables
- `FedExAPICreateShipment` - FedEx API shipment tracking

#### Services Layer (`app/Services/`)

**FedEx Integration** (`app/Services/FedEx/`):
- `FedExService` - OAuth token management with automatic caching (55 min)
- `FedExAPIClient` - HTTP client wrapper for FedEx API calls
- `FedExShipmentBuilder` - Constructs shipment request payloads
- `FedExPickupBuilder` - Constructs pickup request payloads
- `FedExResponseProcessor` - Parses FedEx API responses
- `FedExShipmentRepository` - Database operations for FedEx shipments
- `FedExConstants` - Service types, package types, and other constants

**Other Services**:
- `ScheduleLabelCreationService` - Automated scheduling for FedEx labels (prevents creating labels >10 days before ship date)
- `ExchangeRateService` - Currency conversion rates
- `CountryCodeService` - Country code lookups

#### Controllers Structure (`app/Http/Controllers/Logistic/`)

**Request Lifecycle**:
1. `SubmitRequestController` - Create new shipment requests
2. `ApprovalController` - Approve/reject requests, triggers label creation on approval
3. `UpdateRequestController` - Modify existing requests
4. `CancelRequestController` - Cancel requests

**Shipping Operations**:
- `CreateLabelController` - Generate shipping labels via carrier APIs
- `CreateLabel_Not_Calculate_Rates_Controller` - Direct label creation without rate shopping
- `CreatePickupController` - Schedule carrier pickups
- `ShipmentRequestController` - Query and retrieve shipment data

**Supporting Controllers**:
- `CommonLogisticsController` - Shared utility functions
- `DashboardController` - Dashboard data aggregation
- `PdfExportController` - Generate PDF documents using DomPDF
- `MailSenderController` - Send emails via PHPMailer
- `EmailTemplateController` - Email template rendering
- `AddressListController` - Address CRUD operations
- `AddressListExportImportController` - Excel export/import for addresses
- `GetAddressListFromXenDBController` - Sync addresses from external XEN DB
- `RequestTopicController` - Manage request topics
- `UserListController` - User management
- `PackagingController`, `ParcelBoxTypesController` - Package type management

### Authentication

- **Microsoft Azure AD SSO**: Primary authentication via `MicrosoftAuthController`
  - Azure config: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`
  - Domain restriction: `ALLOWED_DOMAIN=xenoptics.com`
- Route: `POST /api/logistics/login/microsoft`

### Shipment Approval Workflow

1. User submits shipment request via `SubmitRequestController`
2. Request enters `pending` status
3. Approver reviews via `ApprovalController`
4. If approved:
   - Status changes to `approver_approved`
   - Label creation is automatically triggered (or scheduled if ship date >10 days out)
   - Notifications sent to warehouse and logistics teams
5. If rejected:
   - Status changes to `approver_rejected`
   - Creator is notified

### Label Creation & Scheduling

- **Immediate Creation**: Labels for shipments <10 days from ship date are created immediately upon approval
- **Scheduled Creation**: FedEx labels for shipments >10 days out are scheduled via `ScheduleLabelCreationService`
  - `label_status = 'scheduled'`
  - Daily job checks for scheduled labels and creates them when appropriate
  - Prevents label expiration issues
- Label files stored in: `storage/app/public/uploads/labels/`
- Invoice files stored in: `storage/app/public/uploads/invoices/`

### External Integrations

**FedEx API** (`FEDEX_API_URL=https://apis.fedex.com`):
- OAuth2 authentication with automatic token refresh
- Rate quotes endpoint
- Shipment creation
- Pickup scheduling
- Tracking

**Email Notifications**:
- `WAREHOUSE_EMAILS` - Warehouse team notifications
- `LOGISTIC_TEAM_EMAILS` - Logistics team notifications
- Templates in `EmailTemplateController`

**Exchange Rates**:
- Routes: `GET /api/exchange-rates/rates`, `/rate`, `/convert`
- Controller: `ExchangeRateController`
- Service: `ExchangeRateService`

### File Storage

- **Labels**: `storage/app/public/uploads/labels/`
- **Invoices**: `storage/app/public/uploads/invoices/`
- **Public Access**: `GET /uploads/invoices/{filename}` route serves invoice files
- Queue jobs and cache stored in database tables

### Development Setup

1. Clone repository
2. Configure `.env` file (copy from `.env.example`)
3. Set up database connections for SQL Server
4. Run `composer install`
5. Run `php artisan migrate` (if migrations exist)
6. Run `php artisan serve`
7. For full dev environment: `composer dev` (starts server, queue worker, logs, and Vite)

### File Permissions (Production)

- Web server requires write access to `storage/` and `bootstrap/cache/`
- Set ownership: `sudo chown -R www-data:www-data /path/to/project`
- Set permissions: `sudo chmod -R 775 storage bootstrap/cache`

### API Routes

**API Prefix**: `/api`

- **FedEx**: `/fedex/rate-quotes`, `/fedex/quick-rate`, `/fedex/token`
- **DHL Domestic Rates**: `/dhl_ecommerce_domestic_rate_list` (CRUD)
- **Exchange Rates**: `/exchange-rates/*`
- **Auth**: `/logistics/login/microsoft`

Most logistic operations are handled through controllers accessed via web routes (check `routes/web.php` for details).

### Important Notes

- **PSR-4 Compliance**: Some models have case-sensitivity issues (`AddressList.php` vs class `Addresslist`) - be aware when creating new models
- **Database Naming**: SQL Server tables often use PascalCase (e.g., `Address_List`, `Shipment_Request`)
- **Timestamps**: Many models have `public $timestamps = false;` and use custom timestamp fields
- **Primary Keys**: Most models use custom primary key names (not `id`), specified via `protected $primaryKey`
- **Queue Processing**: Run `php artisan queue:listen --tries=1` or use `composer dev` to process background jobs