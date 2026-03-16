# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a full-stack shipment/logistics management system for Xenoptics, consisting of two applications:

- `frontend/xeno-shipment/` — React 19 + TypeScript SPA (see its own CLAUDE.md for detail)
- `backend/xen-erp-backend/` — Laravel 12 PHP API (see its own CLAUDE.md for detail)

## Development Commands

### Frontend (`frontend/xeno-shipment/`)
```bash
npm run dev       # Dev server on port 5173
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`backend/xen-erp-backend/`)
```bash
composer dev      # Full dev environment (server + queue worker + logs + Vite)
php artisan serve # Dev server only
php artisan test  # Run PHPUnit tests
composer test     # Clear config cache + run tests
php artisan queue:listen --tries=1  # Process background jobs manually
php artisan config:clear && php artisan cache:clear && php artisan optimize:clear  # Fix 403/config issues
```

## Architecture Overview

**Frontend** (served at `/xeno-shipment/`): Feature-based React app using atomic design. Business domains (`shipment`, `logistics`, `overview`) are self-contained feature modules. Auth is Microsoft Azure AD SSO via MSAL. Uses typed Redux Toolkit + Context API (Auth, Notification, Breadcrumb). Path aliases map `@components/`, `@features/`, `@redux/`, `@api/` etc. to `src/` subdirectories.

**Backend** (API prefix `/api`, web routes for most logistic ops): Laravel 12 MVC with a Services layer for external integrations. Connects to four SQL Server databases (Logistics, MFG, XEN, XEN_API) — models declare their connection via `protected $connection`. Background jobs (label scheduling, notifications) run through a database-backed queue.

## Key Business Workflow

1. User submits a shipment request → `SubmitRequestController`
2. Request goes through statuses: `requestor_requested → request_to_logistic → logistic_updated → approver_approved | approver_rejected`
3. On approval → `ApprovalController` triggers label creation
   - Ship date **< 10 days out**: label created immediately (`label_status = 'created'`)
   - Ship date **> 10 days out**: label scheduled (`label_status = 'scheduled'`), a daily job creates it when appropriate via `ScheduleLabelCreationService`
4. Notifications sent via PHPMailer to warehouse/logistics distribution lists

## External Integrations

- **FedEx API** (`https://apis.fedex.com`): OAuth2 with 55-min cached token. Rate quotes, shipment creation, pickup scheduling. Service classes in `backend/xen-erp-backend/app/Services/FedEx/`.
- **Microsoft Azure AD**: Primary auth (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, domain-restricted to `xenoptics.com`)
- **SAP Enterpryze**: PO/invoice integration at the internal network IP in `.env`
- **Exchange Rates**: `GET /api/exchange-rates/rates|rate|convert`

## Important Implementation Notes

- **SQL Server tables** use PascalCase with underscores (e.g., `Address_List`, `Shipment_Request`)
- **Models**: Most use `public $timestamps = false;` with custom timestamp fields, and custom `$primaryKey` (not `id`)
- **PSR-4 case sensitivity**: Some models have mismatched filename vs. class name (e.g., `AddressList.php` / class `Addresslist`) — follow existing patterns when adding models
- **Frontend imports**: Always use path aliases, never relative paths crossing feature boundaries
- **i18n**: Both English and Thai locale files live in `frontend/xeno-shipment/public/locales/`
- **File storage**: Labels → `storage/app/public/uploads/labels/`, Invoices → `storage/app/public/uploads/invoices/`
