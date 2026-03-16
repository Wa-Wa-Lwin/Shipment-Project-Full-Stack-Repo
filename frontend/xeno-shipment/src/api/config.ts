import axios from 'axios';

// Create axios instance with default config
export const apiClient = axios.create({
  // In development mode, use empty baseURL to utilize Vite's proxy
  // In production, use the configured backend URL
  baseURL: import.meta.env.DEV
    ? '' // Use Vite proxy in development (configured in vite.config.ts)
    : (import.meta.env.VITE_APP_BACKEND_BASE_URL ||
       import.meta.env.VITE_API_BASE_URL ||
       'http://localhost:3001/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in cross-origin requests
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log the request for debugging
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });

    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Common backend endpoints modernized from env variables.
export const FEDEX_GET_ALL =
  import.meta.env.VITE_APP_FEDEX_GET_ALL || '/api/logistics/fedex_api/get_all';
