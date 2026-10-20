import api from './axios';

// Public: sends the Contact page form to the shop's admins
export const sendContactMessage = (data) => api.post('/contact', data);
