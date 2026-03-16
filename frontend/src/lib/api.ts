/**
 * API Client para comunicação com o FastAPI backend.
 * Gerencia token JWT automaticamente.
 */

const API_BASE = '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('brc_token');
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('brc_token');
    window.location.href = '/minha-conta/login';
    throw new Error('Não autorizado');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    return fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).then(r => r.json());
  },
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Clients ───────────────────────────────────────────────────────────────────
export const clients = {
  me: () => apiFetch('/clients/me'),
  updateMe: (data: Record<string, unknown>) =>
    apiFetch('/clients/me', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Quotes ────────────────────────────────────────────────────────────────────
export const quotes = {
  myQuotes: (page = 1) => apiFetch(`/quotes/my?page=${page}`),
  byToken: (token: string) => apiFetch(`/quotes/${token}`),
  list: (params?: string) => apiFetch(`/quotes/?${params || ''}`),
  updateStatus: (id: number, status: string, notes?: string) =>
    apiFetch(`/quotes/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
};

// ── Storage ───────────────────────────────────────────────────────────────────
export const storage = {
  uploadSTL: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const token = getToken();
    return fetch(`${API_BASE}/storage/upload/stl`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(r => r.json());
  },
};

// ── Slicer ────────────────────────────────────────────────────────────────────
export const slicer = {
  slice: (files: File[], infill = 20, quantity = 1) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('infill', String(infill));
    form.append('quantity', String(quantity));
    return fetch('/api/v1/slicer/slice', { method: 'POST', body: form }).then(r => r.json());
  },
};

export default apiFetch;
