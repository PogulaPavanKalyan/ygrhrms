import api from '../apiClient';

export const authApi = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  logout: () => api.post('/api/auth/logout/'),
  getCurrentUser: () => api.get('/api/auth/user/'),
  getCSRF: () => api.get('/api/auth/csrf/'),
  register: (formData) => api.post('/api/register/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default authApi;
