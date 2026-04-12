import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5144/api',
});

apiClient.interceptors.request.use((config) => {
  try {
    const authStorageStr = localStorage.getItem('enjaz-auth');
    if (authStorageStr) {
      const authStorage = JSON.parse(authStorageStr);
      const token = authStorage?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.error('Failed to parse auth token', err);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('enjaz-auth');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
