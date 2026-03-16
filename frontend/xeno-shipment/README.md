# Xeno Shipment

A modern shipment management system built with React, TypeScript, and Vite.

## Features

- 🚀 **Modern Stack**: React 19, TypeScript, Vite
- 🎨 **UI Components**: HeroUI (NextUI) with Tailwind CSS
- 🌍 **Internationalization**: i18next with English and Thai support
- 🔄 **State Management**: Redux Toolkit
- 🛣️ **Routing**: React Router v7
- 📱 **Responsive Design**: Mobile-first approach
- 🎯 **Type Safety**: Full TypeScript support
- 🔧 **Developer Experience**: ESLint, Prettier, Hot Reload

## Project Structure

```
src/
├── api/                 # API configuration and endpoints
├── components/          # Reusable UI components
│   ├── atoms/          # Basic building blocks
│   ├── molecules/      # Simple component combinations
│   ├── organisms/      # Complex UI components
│   ├── common/         # Common components
│   ├── charts/         # Chart components
│   └── templates/      # Page templates
├── constants/          # Application constants
├── context/            # React Context providers
├── features/           # Feature-specific modules
├── hooks/              # Custom React hooks
├── redux/              # Redux store and slices
├── routers/            # Route configuration
├── services/           # Business logic services
├── styles/             # Global styles and SCSS
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── locales/            # Translation files
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xeno-shipment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=Xeno Shipment
```

### Path Aliases

The project uses path aliases for cleaner imports:

- `@/` - src/
- `@api/` - src/api/
- `@components/` - src/components/
- `@constants/` - src/constants/
- `@hooks/` - src/hooks/
- `@redux/` - src/redux/
- `@utils/` - src/utils/
- And more...

## Technology Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **UI Library**: HeroUI (NextUI)
- **Styling**: Tailwind CSS, SCSS
- **State Management**: Redux Toolkit
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Internationalization**: i18next
- **Icons**: HeroUI Icons
- **Animations**: Framer Motion

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing folder structure
- Use path aliases for imports
- Write meaningful component and function names
- Add proper TypeScript types

### Component Structure

```tsx
// Example component structure
import { FC } from 'react';
import { cn } from '@utils';

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

const Component: FC<ComponentProps> = ({ className, children }) => {
  return (
    <div className={cn('base-styles', className)}>
      {children}
    </div>
  );
};

export default Component;
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
