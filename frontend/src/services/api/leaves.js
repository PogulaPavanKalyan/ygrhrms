import api from '../apiClient';

export const leavesApi = {
  getLeaves: () => api.get('/api/leaves/'),
  applyLeave: (data) => api.post('/api/leaves/', data),
  approveLeave: (id, action) => api.post(`/api/leaves/${id}/action/`, { action }),
  getHolidays: () => api.get('/api/holidays/'),
  createHoliday: (data) => api.post('/api/holidays/', data),
  deleteHoliday: (id) => api.delete(`/api/holidays/${id}/`)
};

export default leavesApi;
