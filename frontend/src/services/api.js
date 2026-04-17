import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (skip auth endpoints so login/register can handle their own errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email, password, fullName, phone) =>
    api.post('/auth/register', { email, password, full_name: fullName, phone }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  seedAdmin: () => api.post('/auth/admin/seed'),
};

// Products API
export const productsAPI = {
  getAll: (params = {}) => api.get('/products/', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getStock: (id) => api.get(`/products/${id}/stock`),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart/'),
  add: (productId, quantity) =>
    api.post('/cart/add', { product_id: productId, quantity }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
  update: (productId, quantity) => api.put(`/cart/update/${productId}?quantity=${quantity}`),
};

// Orders API
export const ordersAPI = {
  checkout: (shippingData) => api.post('/orders/checkout', shippingData || {}),
  getAll: () => api.get('/orders/'),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
};

// Wishlist API
export const wishlistAPI = {
  get: () => api.get('/wishlist/'),
  add: (productId) => api.post('/wishlist/add', { product_id: productId }),
  remove: (productId) => api.delete(`/wishlist/remove/${productId}`),
};

// Reviews API
export const reviewAPI = {
  getByProduct: (productId, skip = 0, limit = 20) =>
    api.get(`/reviews/product/${productId}`, { params: { skip, limit } }),
  getAll: (skip = 0, limit = 20) => api.get('/reviews/', { params: { skip, limit } }),
  create: (productId, rating, comment) =>
    api.post('/reviews/', { product_id: productId, rating, comment }),
};

// Admin API
export const adminAPI = {
  getProducts: (page = 1, limit = 50) =>
    api.get('/admin/products/', { params: { page, limit } }),
  createProduct: (data) => api.post('/admin/products/', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateStock: (id, quantity) => api.put(`/admin/products/${id}/stock`, { quantity }),
};

// Search Service API — dedicated microservice at /search/
export const searchAPI = {
  search: (params = {}) => api.get('/search/', { params }),
};

export default api;
