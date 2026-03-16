# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production (runs TypeScript compilation and Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a modern React shipment management system built with TypeScript and Vite. The application uses a feature-based architecture with the following key patterns:

### Core Technology Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite with React SWC plugin
- **UI Framework**: HeroUI (NextUI) with Tailwind CSS
- **State Management**: Redux Toolkit (store configured but minimal slices currently)
- **Routing**: React Router v7 with nested routes
- **HTTP Client**: Axios for API calls
- **Internationalization**: i18next with English/Thai support
- **Animations**: Framer Motion

### Project Structure

The codebase follows atomic design principles and feature-based organization:

- **Features**: Main business domains (`shipment`, `logistics`, `overview`)
  - Each feature contains its own components, types, and business logic
  - Features are self-contained modules that can be developed independently
- **Components**: Organized by atomic design (`atoms/`, `common/`, `layout/`)
- **State Management**: Redux store setup with typed hooks (`useAppDispatch`, `useAppSelector`)
- **Routing**: Nested route structure with breadcrumb support
- **Path Aliases**: Extensive alias system for clean imports (e.g., `@components/`, `@features/`, `@api/`)

### Key Architectural Patterns

1. **Feature-Based Organization**: Business logic grouped by domain (shipment, logistics, overview)
2. **Atomic Design**: UI components structured from atoms to organisms
3. **Typed Redux**: Full TypeScript integration with Redux Toolkit
4. **Route-Based Code Splitting**: Components can be lazy-loaded (infrastructure in place)
5. **Internationalization**: Multi-language support built into component structure

### Authentication & Authorization
The app includes login functionality with protected routes. Main navigation is handled through the Home component which acts as a layout wrapper for authenticated features.

### Environment Configuration
- Uses Vite environment variables (VITE_ prefix)
- Default API base URL: `http://localhost:3001/api`
- Development server runs on port 5173 with polling for file watching

### Import Patterns
Always use path aliases for imports:
- `@/` for src root
- `@components/` for UI components  
- `@features/` for business features
- `@redux/` for state management
- `@api/` for API configuration
- And other aliases as defined in vite.config.ts and tsconfig.json