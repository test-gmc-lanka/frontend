import api from './axios';

export const bookAppointment = (data) => api.post('/appointments', data);
export const getMyAppointments = () => api.get('/appointments');
export const rescheduleAppointment = (id, data) =>
  api.put(`/appointments/${id}/reschedule`, data);
export const cancelAppointment = (id) => api.delete(`/appointments/${id}`);
export const adminGetAppointments = (params) =>
  api.get('/admin/appointments', { params });
// extra: { meetingLink, note } — meetingLink is only used when approving
export const adminUpdateAppointmentStatus = (id, status, extra = {}) =>
  api.put(`/admin/appointments/${id}/status`, { status, ...extra });
export const adminRescheduleAppointment = (id, newDate, note) =>
  api.put(`/admin/appointments/${id}/reschedule`, { newDate, note });
