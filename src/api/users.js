import api from './axios';

export const getProfile = () => api.get('/users/me');
export const updateProfile = (data) => api.put('/users/me', data);
export const changePassword = (data) => api.put('/users/me/password', data);
export const getNotifications = () => api.get('/users/me/notifications');
export const getUnreadCount = () => api.get('/users/me/notifications/unread-count');
export const markNotificationsRead = () => api.post('/users/me/notifications/mark-read');
export const adminGetUsers = (params) => api.get('/admin/users', { params });
export const adminCreateUser = (data) => api.post('/admin/users', data);
export const adminDeactivateUser = (id) => api.patch(`/admin/users/${id}/deactivate`);
export const adminActivateUser = (id) => api.patch(`/admin/users/${id}/activate`);
