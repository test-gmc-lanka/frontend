import api from './axios';

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const getCategories = () => api.get('/products/categories');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const uploadProductImages = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return api.post('/products/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getProductReviews = (id) => api.get(`/products/${id}/reviews`);
// Archive (active=false) or restore (active=true) a product
export const setProductActive = (id, active) => api.patch(`/products/${id}/active`, null, { params: { active } });
