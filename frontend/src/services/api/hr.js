import api from '../apiClient';

export const hrApi = {
  getEmployeeDashboard: () => api.get('/api/dashboard/employee/'),
  getHRDashboard: () => api.get('/api/dashboard/hr/'),
  getTLDashboard: () => api.get('/api/dashboard/teamlead/'),
  getManagerDashboard: () => api.get('/api/dashboard/manager/'),
  getMDDashboard: () => api.get('/api/dashboard/md/'),
  updateProfile: (data) => api.post('/api/profile/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHRSettings: () => api.get('/api/hr-settings/'),
  updateHRSettings: (data) => api.post('/api/hr-settings/', data)
};

export default hrApi;
