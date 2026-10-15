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
