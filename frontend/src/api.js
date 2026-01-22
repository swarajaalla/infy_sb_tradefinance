import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Ensure this matches your FastAPI backend
});

// 1. REQUEST INTERCEPTOR: Attaches JWT for secure endpoints
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. RESPONSE INTERCEPTOR: Handles session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole'); // Clear role data on expiry
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 3. INTEGRATED API METHODS
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const documentApi = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // UPDATED: Renamed to getAll to match your components
  getAll: () => api.get('/documents'), 
  verify: (docId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/documents/${docId}/verify`, formData);
  },
  // Added helper for individual downloads
  download: (fileName) => api.get(`/api/documents/download/${fileName}`, {
    responseType: 'blob'
  }),
  getLedger: (docId) => api.get(`/documents/${docId}/ledger`),
};

export const riskApi = {
  // Powers the updated RiskAnalysis.jsx page
  getRiskMetrics: () => api.get('/analytics/risk-scores'),
  getIntegrityLog: () => api.get('/integrity/logs'),
  // Alerts endpoint for system-wide monitoring
  getSystemAlerts: () => api.get('/integrity/alerts'),
};

export default api;