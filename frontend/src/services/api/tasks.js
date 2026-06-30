import api from '../apiClient';

export const tasksApi = {
  getProjects: () => api.get('/api/projects/'),
  createProject: (data) => api.post('/api/projects/', data),
  getTasks: () => api.get('/api/tasks/'),
  createTask: (data) => api.post('/api/tasks/', data),
  updateTask: (id, data) => api.put(`/api/tasks/${id}/`, data),
  deleteTask: (id) => api.delete(`/api/tasks/${id}/`),
  getDailyReports: () => api.get('/api/daily-reports/'),
  submitDailyReport: (data) => api.post('/api/daily-reports/', data)
};

export default tasksApi;
