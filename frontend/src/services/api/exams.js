import api from '../apiClient';

export const examsApi = {
  getResults: () => api.get('/api/exams/'),
  submitExam: (data) => api.post('/api/exams/', data),
  getQuestions: (params) => api.get('/api/questions/', { params }),
  createQuestion: (data) => api.post('/api/questions/', data),
  updateQuestion: (id, data) => api.put(`/api/questions/${id}/`, data),
  deleteQuestion: (id) => api.delete(`/api/questions/${id}/`)
};

export default examsApi;
