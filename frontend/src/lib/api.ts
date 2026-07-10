import { Product, Portfolio, PortfolioItem, Settings, BackupData, DashboardStats } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function getAdminKey(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('admin_key') || undefined;
}

function setAdminKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_key', key);
  }
}

function promptAdminKey(): string | undefined {
  const key = window.prompt('Enter admin key to perform this action:');
  if (key) setAdminKey(key);
  return key || undefined;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(error.error?.message || 'Request failed');
  }

  return res.json();
}

async function adminRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  let adminKey = getAdminKey();
  if (!adminKey) {
    adminKey = promptAdminKey();
    if (!adminKey) throw new Error('Admin key required');
  }

  return request<T>(endpoint, {
    method: 'POST',
    headers: { 'x-admin-key': adminKey },
    body: JSON.stringify(body),
  });
}

export const api = {
  products: {
    list: (params?: Record<string, string>) =>
      request<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }>(
        `/products${params ? `?${new URLSearchParams(params)}` : ''}`
      ),
    search: (q: string) =>
      request<Product[]>(`/products/search?q=${encodeURIComponent(q)}`),
    get: (id: string) =>
      request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),
    toggleFavorite: (id: string) =>
      request<Product>(`/products/${id}/favorite`, { method: 'PUT' }),
  },

  portfolios: {
    list: (status?: string) =>
      request<Portfolio[]>(`/portfolios${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<Portfolio>(`/portfolios/${id}`),
    create: (data: Partial<Portfolio>) =>
      request<Portfolio>('/portfolios', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Portfolio>) =>
      request<Portfolio>(`/portfolios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/portfolios/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) =>
      request<Portfolio>(`/portfolios/${id}/duplicate`, { method: 'POST' }),
  },

  portfolioItems: {
    add: (portfolioId: string, data: { productId: string; quantity?: number; itemDate?: string }) =>
      request<{ item: PortfolioItem; portfolio: Portfolio }>(`/portfolio/${portfolioId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ quantity: number; pv: number; dp: number; productName: string; productCode: string; size: string; itemDate: string }>) =>
      request<{ item: PortfolioItem; portfolio: Portfolio }>(`/portfolio/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string; portfolio: Portfolio }>(`/portfolio/items/${id}`, {
        method: 'DELETE',
      }),
  },

  dashboard: {
    stats: async (): Promise<DashboardStats> => {
      const [productsRes, portfolios] = await Promise.all([
        request<{ products: Product[]; total: number }>('/products?limit=1'),
        request<Portfolio[]>('/portfolios'),
      ]);
      const totalPV = portfolios.reduce((sum, p) => sum + (p.items?.reduce((s, i) => s + (i.totalPV || 0), 0) || 0), 0);
      return {
        totalProducts: productsRes.total,
        totalPortfolios: portfolios.length,
        totalPV,
        recentPortfolios: portfolios.slice(0, 5),
      };
    },
  },

  settings: {
    get: () => request<Settings>('/settings'),
    update: (data: Partial<Settings>) =>
      request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
    reset: () =>
      adminRequest<{ message: string }>('/settings/reset', { confirm: true }),
    backup: () =>
      request<BackupData>('/settings/backup'),
    restore: (data: BackupData) =>
      adminRequest<{ message: string }>('/settings/restore', { data }),
    seed: () =>
      adminRequest<{ message: string; total: number }>('/settings/seed', { confirm: true }),
  },
};
