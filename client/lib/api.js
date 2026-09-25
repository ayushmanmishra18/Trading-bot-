import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api' });

api.interceptors.request.use((c) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('token');
    if (t) c.headers.Authorization = `Bearer ${t}`;
  }
  return c;
});

// Expired/invalid token: drop it so the UI falls back to signed-out state
// instead of retrying with a dead credential on every request.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export function logout() {
  if (typeof window !== 'undefined') localStorage.removeItem('token');
}

export default api;
