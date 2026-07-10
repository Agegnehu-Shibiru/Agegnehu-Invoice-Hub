import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest)).catch((err) => Promise.reject(err));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await api.post('/auth/refresh-token');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        useAuthStore?.getState?.()?.logout?.();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status !== 401) toast.error(message);
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  sendOtp: (phone) => api.post('/auth/phone/send-otp', { phone }),
  verifyOtp: (phone, otp) => api.post('/auth/phone/verify-otp', { phone, otp }),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// Users
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  updatePassword: (data) => api.patch('/users/me/password', data),
  deleteMe: () => api.delete('/users/me'),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Invoices
export const invoiceApi = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  getPublic: (shareToken) => api.get(`/invoices/public/${shareToken}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.patch(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  send: (id) => api.post(`/invoices/${id}/send`),
  markPaid: (id, data) => api.post(`/invoices/${id}/mark-paid`, data),
  getStats: () => api.get('/invoices/stats'),
};

// Clients
export const clientApi = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.patch(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Payments
export const paymentApi = {
  stripeCheckout: (shareToken) => api.post('/payments/stripe/checkout', { shareToken }),
  stripeSubscription: (plan, interval) => api.post('/payments/stripe/subscription', { plan, interval }),
  paypalCreateOrder: (shareToken) => api.post('/payments/paypal/create-order', { shareToken }),
  paypalCapture: (orderId, shareToken) => api.post('/payments/paypal/capture-order', { orderId, shareToken }),
  getHistory: (params) => api.get('/payments/history', { params }),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  banUser: (id) => api.post(`/admin/users/${id}/ban`),
  getApiTracker: (params) => api.get('/admin/api-tracker', { params }),
  getEmailLogs: (params) => api.get('/admin/email-logs', { params }),
};
