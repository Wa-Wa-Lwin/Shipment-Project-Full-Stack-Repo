# Address List Module

This module has been refactored into a clean, maintainable structure following best practices.

## Directory Structure

```
address-list/
├── components/           # Reusable UI components
│   ├── AlertToast.tsx           # Toast notification component
│   ├── SortableTableHeader.tsx  # Generic sortable table header
│   ├── AddressCreateModal.tsx   # Modal for creating addresses
│   ├── AddressImportModal.tsx   # Modal for importing addresses
│   └── index.ts                 # Barrel export
├── hooks/                # Custom React hooks
│   └── useAlert.ts              # Alert management hook (3s auto-dismiss)
├── services/             # API service layer
│   └── addressService.ts        # Address-related API calls
├── types.ts              # TypeScript type definitions
├── AddressList.tsx       # Main component (refactored)
└── AddressList.old.tsx   # Original file (backup)
```

## Key Improvements

### 1. **Separation of Concerns**
   - **Components**: Pure presentational components
   - **Hooks**: Reusable stateful logic
   - **Services**: API calls and business logic
   - **Main Component**: Orchestration and layout only

### 2. **Reusable Components**
   - `AlertToast`: Can be used anywhere in the app for notifications
   - `SortableTableHeader`: Generic component that works with any data type
   - `AddressCreateModal`: Extracted 200+ lines into a focused component
   - `AddressImportModal`: File upload logic encapsulated

### 3. **Custom Hooks**
   - `useAlert`: Manages alert state with auto-dismiss functionality
   - Easy to reuse across different pages

### 4. **Service Layer**
   - `addressService`: Clean API for address operations
     - `exportAll()`: Export addresses to Excel
     - `exportTemplate()`: Download import template
     - `importAddresses()`: Upload and import addresses
     - `downloadFile()`: Utility for file downloads

### 5. **Benefits**
   - **Maintainability**: Each file has a single responsibility
   - **Testability**: Components and services can be tested independently
   - **Reusability**: Components can be used in other parts of the app
   - **Readability**: Main component reduced from ~1000 lines to ~600 lines
   - **Type Safety**: Full TypeScript support throughout

## Usage

### Import Components
```typescript
import { AlertToast, SortableTableHeader } from './components'
```

### Use Service
```typescript
import { addressService } from './services/addressService'

const blob = await addressService.exportAll()
```

### Use Hook
```typescript
import { useAlert } from './hooks/useAlert'

const { alertMessage, showAlert, closeAlert } = useAlert()
showAlert('Success!', 'success')
```

## Migration Notes

- The original file is backed up as `AddressList.old.tsx`
- All functionality remains the same
- No breaking changes to external APIs
- Can be safely rolled back if needed
