// API Constants
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Shipment related
  SHIPMENTS: '/shipments',
  SHIPMENT_DETAILS: (id: string) => `/shipments/${id}`,
  
  // User management
  USERS: '/users',
  USER_PROFILE: '/users/profile',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const API_TIMEOUT = {
  DEFAULT: 10000,
  UPLOAD: 30000,
} as const;
