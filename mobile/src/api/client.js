import Constants from 'expo-constants';

// In production this would point to your Vercel deployment
const BASE = (Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001') + '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const tasksApi = {
  getAll: (category) => request(`/tasks${category ? `?category=${category}` : ''}`),
  create: (task) => request('/tasks', { method: 'POST', body: task }),
  update: (id, updates) => request(`/tasks/${id}`, { method: 'PATCH', body: updates }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  toggle: (id) => request(`/tasks/${id}/toggle`, { method: 'POST' }),
};

export const settingsApi = {
  get: () => request('/settings'),
  update: (updates) => request('/settings', { method: 'PATCH', body: updates }),
};
