import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Auth APIs
export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await axios.post(`${API_BASE}/api/auth/register`, { username, email, password });
  if (res.data.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
  if (res.data.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
}

export async function logout(): Promise<void> {
  await axios.post(`${API_BASE}/api/auth/logout`);
  localStorage.removeItem('token');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const res = await axios.get(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.user;
  } catch (err) {
    localStorage.removeItem('token');
    return null;
  }
}

// Alert APIs
export async function fetchAlerts() {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_BASE}/api/alerts`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
}

export async function createAlert(formData: FormData) {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${API_BASE}/api/alerts`, formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

export async function resolveAlert(id: string) {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${API_BASE}/api/alerts/${id}/resolve`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
}

export async function deleteAlert(id: string) {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${API_BASE}/api/alerts/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
}

// Admin APIs
export async function getAdminStats() {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_BASE}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getAdminUsers() {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_BASE}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getAdminAlerts() {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_BASE}/api/admin/alerts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function adminDeleteUser(userId: string) {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${API_BASE}/api/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function adminUpdateUser(userId: string, updates: { username?: string; email?: string; isAdmin?: boolean }) {
  const token = localStorage.getItem('token');
  const res = await axios.patch(`${API_BASE}/api/admin/users/${userId}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function adminDeleteAlert(alertId: string) {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${API_BASE}/api/admin/alerts/${alertId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function adminUpdateAlert(alertId: string, updates: { title?: string; description?: string; risk?: string; resolved?: boolean }) {
  const token = localStorage.getItem('token');
  const res = await axios.patch(`${API_BASE}/api/admin/alerts/${alertId}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
