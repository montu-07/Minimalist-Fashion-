/**
 * API utility for making authenticated requests
 * Handles token management, error handling, and response parsing
 */

// Base URL for API requests (can be configured via environment variables)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// Store for the current token
let authToken = null;

/**
 * Set the authentication token for API requests
 * @param {string} token - The JWT token
 */
export const setAuthToken = (token) => {
  authToken = token;
};

/**
 * Get the current authentication token
 * @returns {string|null} The current auth token
 */
export const getAuthToken = () => {
  return authToken || localStorage.getItem('auth:token') || sessionStorage.getItem('auth:token');
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If request fails or returns error
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Ensure headers exist
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth header if token exists
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create request options
  const requestOptions = {
    ...options,
    headers,
    credentials: 'include', // For cookies if using httpOnly
  };

  // Ensure body is stringified if it's an object
  if (requestOptions.body && typeof requestOptions.body === 'object') {
    requestOptions.body = JSON.stringify(requestOptions.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    const data = await response.json().catch(() => ({}));

    // Handle non-2xx responses
    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Handle specific error cases
    if (error.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    
    throw error;
  }
};

// HTTP method shortcuts
export const api = {
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'POST', body }),
    
  put: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PUT', body }),
    
  patch: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'PATCH', body }),
    
  delete: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

// Initialize with any existing token
export const initApi = () => {
  // Set initial token if available
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
  }
  
  // Listen for auth changes
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:login', (e) => {
      if (e.detail?.token) {
        setAuthToken(e.detail.token);
      }
    });
    
    window.addEventListener('auth:logout', () => {
      setAuthToken(null);
    });
  }
};

// Initialize on import
initApi();
