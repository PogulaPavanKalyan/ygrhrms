import api from '../apiClient';

export const invoicesApi = {
  getInvoices: () => api.get('/api/invoices/'),
  createInvoice: (data) => api.post('/api/invoices/', data),
  deleteInvoice: (id) => api.delete(`/api/invoices/${id}/`),
  getInvoicingResources: () => api.get('/api/invoicing-resources/')
};

export default invoicesApi;
