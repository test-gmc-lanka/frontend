import api from './axios';

// Checkout
export const getCheckoutSummary = () => api.get('/orders/checkout-summary');
// Returns { order, payment } — payment holds the Stripe details for card orders
export const placeOrder = (data) => api.post('/orders', data);

// Card payment for an existing order ("Pay now" / retry)
export const startOrderPayment = (id) => api.post(`/orders/${id}/payment`);
// Asks the server to check the payment with Stripe and returns the updated order
export const confirmOrderPayment = (id) => api.post(`/orders/${id}/payment/confirm`);

export const getMyOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const adminGetOrders = (params) => api.get('/admin/orders', { params });
export const adminUpdateOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, { status });
