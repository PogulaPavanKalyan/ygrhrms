import api from '../apiClient';

export const payrollApi = {
  getPayslips: () => api.get('/api/payslips/'),
  getPayslip: (id) => api.get(`/api/payslips/${id}/`),
  deletePayslip: (id) => api.delete(`/api/payslips/${id}/`),
  createPayslip: (data) => api.post('/api/payslips/', data),
  getSalaryStructures: () => api.get('/api/salary-structures/'),
  createSalaryStructure: (data) => api.post('/api/salary-structures/', data)
};

export default payrollApi;
