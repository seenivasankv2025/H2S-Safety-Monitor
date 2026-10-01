import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('h2s_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth APIs
export const loginApi = async (username, password) => {
  const res = await api.post('/auth/login', { username, password });
  return res.data;
};

export const registerApi = async (accessId, password, role = 'WORKER', department = '') => {
  const res = await api.post('/auth/register', { access_id: accessId, password, role, department });
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Worker APIs
export const getWorkerDashboardApi = async () => {
  const res = await api.get('/worker/dashboard');
  return res.data;
};

export const getWorkerHistoryApi = async () => {
  const res = await api.get('/worker/history');
  return res.data;
};

// Analysis APIs
export const uploadImageApi = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('is_demo', 'false');
  
  const res = await axios.post('/api/analysis/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${localStorage.getItem('h2s_access_token')}`
    }
  });
  return res.data;
};

export const analyzeLiveFrameApi = async (base64Image) => {
  const res = await api.post('/analysis/live', {
    image_base64: base64Image,
    is_demo: false
  });
  return res.data;
};


export default api;
