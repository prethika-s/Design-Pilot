import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Automatic token attachment interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

export const projectAPI = {
  getAll: () => API.get('/projects'),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  delete: (id) => API.delete(`/projects/${id}`),
  getStats: () => API.get('/projects/stats'),
  
  // AI Wizards
  runDiscovery: (id, idea) => API.post(`/projects/${id}/discovery`, { idea }),
  processRequirements: (id, answers) => API.post(`/projects/${id}/requirements`, { answers }),
  generateArchitecture: (id) => API.post(`/projects/${id}/architecture`),
  analyzeTradeoffs: (id) => API.post(`/projects/${id}/tradeoff`),
  
  // PDF Report
  generateReport: (id) => API.post(`/projects/${id}/report`),
  getReports: (id) => API.get(`/projects/${id}/reports`),
};

export const decisionAPI = {
  getByProject: (projectId) => API.get(`/decisions/${projectId}`),
  create: (data) => API.post('/decisions', data),
  update: (id, data) => API.put(`/decisions/${id}`, data),
  delete: (id) => API.delete(`/decisions/${id}`),
};

export default API;
