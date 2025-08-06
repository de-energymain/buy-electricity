// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
};

// API Endpoints
export const API_ENDPOINTS = {
  USERS: `${API_CONFIG.BASE_URL}/api/users`,
  PURCHASES: `${API_CONFIG.BASE_URL}/api/purchases`,
  PLANTS: `${API_CONFIG.BASE_URL}/api/plants`,
};
