import api from './axios';

export const bookAppointment = (data) => api.post('/appointments', data);
export const getMyAppointments = () => api.get('/appointments');
export const rescheduleAppointment = (id, data) =>
  api.put(`/appointments/${id}/reschedule`, data);
export const cancelAppointment = (id) => api.delete(`/appointments/${id}`);
export const adminGetAppointments = (params) =>
  api.get('/admin/appointments', { params });
export const adminUpdateAppointmentStatus = (id, status) =>
  api.put(`/admin/appointments/${id}/status`, { status });
