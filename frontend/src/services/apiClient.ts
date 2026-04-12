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
    // Only force-logout on 401 if we actually got a response from the server
    // In Demo Mode (no backend), errors are network errors (no response), not 401s
    if (error.response && error.response.status === 401) {
      // Check if this is a demo session (no real token)
      const authStr = localStorage.getItem('enjaz-auth');
      const isDemoSession = authStr && JSON.parse(authStr)?.state?.token?.startsWith('demo_');
      
      if (!isDemoSession) {
        localStorage.removeItem('enjaz-auth');
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
