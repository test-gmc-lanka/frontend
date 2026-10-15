import api from './axios';

export const placeOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const adminGetOrders = (params) => api.get('/admin/orders', { params });
export const adminUpdateOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, { status });
