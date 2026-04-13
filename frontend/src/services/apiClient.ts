import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5144/api/v1',
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
    if (error.response && error.response.status === 401) {
      // Check if this is a demo session (no real token)
      let isDemoSession = false;
      try {
        const authStr = localStorage.getItem('enjaz-auth');
        isDemoSession = !!(authStr && JSON.parse(authStr)?.state?.token?.startsWith('demo_'));
      } catch {
        // Corrupted localStorage — treat as non-demo
      }
      
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
