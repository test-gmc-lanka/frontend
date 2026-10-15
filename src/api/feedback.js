import api from './axios';

export const submitFeedback = (data) => api.post('/feedback', data);
export const getMyFeedback = () => api.get('/feedback');
export const submitComplaint = (data) => api.post('/complaints', data);
export const getMyComplaints = () => api.get('/complaints');
export const submitCustomDesign = (formData) =>
  api.post('/custom-designs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getMyDesigns = () => api.get('/custom-designs');
