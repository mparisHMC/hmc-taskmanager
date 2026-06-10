const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getAll: (category) => request(`/tasks${category ? `?category=${category}` : ''}`),
  get: (id) => request(`/tasks/${id}`),
  create: (task) => request('/tasks', { method: 'POST', body: task }),
  update: (id, updates) => request(`/tasks/${id}`, { method: 'PATCH', body: updates }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  toggle: (id) => request(`/tasks/${id}/toggle`, { method: 'POST' }),
  seed: () => request('/tasks/seed', { method: 'POST' }),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => request('/settings'),
  update: (updates) => request('/settings', { method: 'PATCH', body: updates }),
};

// ─── Integrations ─────────────────────────────────────────────────────────────
export const integrationsApi = {
  status: () => request('/integrations/status'),
  googleSync: () => request('/integrations/google/sync', { method: 'POST' }),
  slackTest: () => request('/integrations/slack/test', { method: 'POST' }),
};
