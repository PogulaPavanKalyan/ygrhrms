import axios from 'axios';

// Create a configured Axios instance
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Dynamically match host to avoid SameSite cookie block
  const hostname = window.location.hostname || '127.0.0.1';
  return `http://${hostname}:8000`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Response interceptor to catch authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we receive a 401 Unauthorized, it means the user's session expired or is invalid
    if (error.response && error.response.status === 401) {
      // Clear any stored authentication info and trigger redirect if not already on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
