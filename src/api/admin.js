import api from './axios';

export const getDashboard = () => api.get('/admin/dashboard');
export const adminGetFeedback = () => api.get('/admin/feedback');
export const adminGetComplaints = () => api.get('/admin/complaints');
export const adminUpdateComplaintStatus = (id, status) =>
  api.patch(`/admin/complaints/${id}/status`, null, { params: { status } });
export const adminGetDesigns = () => api.get('/admin/custom-designs');
export const adminUpdateDesignStatus = (id, status) =>
  api.patch(`/admin/custom-designs/${id}/status`, null, { params: { status } });
export const adminGetInvoices = () => api.get('/admin/invoices');
export const adminGenerateInvoice = (orderId) => api.post(`/admin/invoices/orders/${orderId}`);
export const adminGetMaintenance = () => api.get('/admin/maintenance');
export const adminAssignMaintenance = (data) => api.post('/admin/maintenance', data);
export const adminCreateCategory = (data) => api.post('/admin/categories', data);
export const adminUpdateCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const adminDeleteCategory = (id) => api.delete(`/admin/categories/${id}`);
export const adminUploadMaintenanceImages = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return api.post('/admin/maintenance/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
// Hide a review from the product page (or show it again)
export const adminSetFeedbackVisibility = (id, hidden) =>
  api.patch(`/admin/feedback/${id}/visibility`, null, { params: { hidden } });
// Includes archived products (the public catalog hides them)
export const adminGetProducts = () => api.get('/admin/products');
