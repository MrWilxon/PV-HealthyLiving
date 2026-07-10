import { create } from 'zustand';
import { Product } from '@/types';
import { api } from '@/lib/api';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  searchQuery: string;
  filters: {
    minPv: string;
    maxPv: string;
    minPrice: string;
    maxPrice: string;
    favorite: boolean;
    size: string;
    hasPv: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  fetchProducts: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  clearSearch: () => void;
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setFilters: (filters: Partial<ProductState['filters']>) => void;
  setPage: (page: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  searchQuery: '',
  sortBy: 'name',
  sortOrder: 'asc',
  filters: {
    minPv: '',
    maxPv: '',
    minPrice: '',
    maxPrice: '',
    favorite: false,
    size: '',
    hasPv: '',
  },

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters, page, limit, sortBy, sortOrder } = get();
      const params: Record<string, string> = {};
      params.page = String(page);
      params.limit = String(limit);
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
      if (filters.minPv) params.minPv = filters.minPv;
      if (filters.maxPv) params.maxPv = filters.maxPv;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.favorite) params.favorite = 'true';
      if (filters.size) params.size = filters.size;
      if (filters.hasPv) params.hasPv = filters.hasPv;

      const result = await api.products.list(params);
      set({
        products: result.products,
        total: result.total,
        totalPages: result.totalPages,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  searchProducts: async (query: string) => {
    if (!query.trim()) {
      set({ searchQuery: '' });
      get().fetchProducts();
      return;
    }
    set({ isLoading: true, searchQuery: query });
    try {
      const results = await api.products.search(query);
      set({
        products: results,
        total: results.length,
        totalPages: 1,
        page: 1,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', page: 1 });
    get().fetchProducts();
  },

  createProduct: async (data) => {
    set({ error: null });
    try {
      const product = await api.products.create(data);
      set((state) => ({ products: [...state.products, product] }));
      return product;
    } catch (e: any) {
      const msg = e?.message || 'Failed to create product';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  updateProduct: async (id, data) => {
    set({ error: null });
    try {
      const product = await api.products.update(id, data);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? product : p)),
      }));
      return product;
    } catch (e: any) {
      const msg = e?.message || 'Failed to update product';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  deleteProduct: async (id) => {
    set({ error: null });
    try {
      await api.products.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete product';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  toggleFavorite: async (id) => {
    set({ error: null });
    try {
      const product = await api.products.toggleFavorite(id);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? product : p)),
      }));
    } catch (e: any) {
      const msg = e?.message || 'Failed to toggle favorite';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      page: 1,
    }));
  },

  setPage: (page) => {
    set({ page });
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder, page: 1 });
  },
}));
