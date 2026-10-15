import api from './axios';

export const getCart = () => api.get('/cart');
export const addToCart = (data) => api.post('/cart/items', data);
export const updateCartItem = (id, quantity) =>
  api.put(`/cart/items/${id}`, null, { params: { quantity } });
export const removeCartItem = (id) => api.delete(`/cart/items/${id}`);
export const clearCart = () => api.delete('/cart');
