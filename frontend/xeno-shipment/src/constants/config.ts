// Application Configuration
export const APP_CONFIG = {
  NAME: 'Xeno Shipment',
  VERSION: '1.0.0',
  DESCRIPTION: 'Shipment Management System',
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  
  // Local Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    THEME: 'theme',
    LANGUAGE: 'language',
  },
  
  // Theme Configuration
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  
  // Language Configuration
  LANGUAGES: {
    EN: 'en',
    TH: 'th',
  },
  
  // Default Values
  DEFAULTS: {
    THEME: 'light',
    LANGUAGE: 'en',
    PAGE_SIZE: 10,
  },
} as const;
