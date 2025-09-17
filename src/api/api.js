import axios from 'axios';

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For sending cookies with requests
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Clear auth data and redirect to login
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        window.dispatchEvent(new Event('auth:expired'));
      }
      
      // You can add more error handling here (e.g., for 403, 404, 500, etc.)
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({ message: 'No response from server. Please check your connection.' });
    } else {
      // Something happened in setting up the request
      return Promise.reject({ message: error.message });
    }
  }
);

// Helper functions for common HTTP methods
const http = {
  get: (url, params = {}, config = {}) => 
    api.get(url, { ...config, params }),
  
  post: (url, data = {}, config = {}) => 
    api.post(url, data, config),
  
  put: (url, data = {}, config = {}) => 
    api.put(url, data, config),
  
  patch: (url, data = {}, config = {}) => 
    api.patch(url, data, config),
  
  delete: (url, config = {}) => 
    api.delete(url, config),
  
  // File upload helper
  upload: (url, file, fieldName = 'file', data = {}, config = {}) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Append additional data to formData if needed
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default http;
