import { create } from 'zustand';
import { Portfolio, PortfolioItem } from '@/types';
import { api } from '@/lib/api';
import { calculateItemTotals } from '@/lib/utils';

interface PortfolioState {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  fetchPortfolios: (status?: string) => Promise<void>;
  fetchPortfolio: (id: string) => Promise<void>;
  clearCurrentPortfolio: () => void;
  createPortfolio: (data: Partial<Portfolio>) => Promise<Portfolio>;
  updatePortfolio: (id: string, data: Partial<Portfolio>) => Promise<Portfolio>;
  deletePortfolio: (id: string) => Promise<void>;
  duplicatePortfolio: (id: string) => Promise<Portfolio>;
  addItem: (portfolioId: string, productId: string, quantity?: number, itemDate?: string) => Promise<void>;
  updateItem: (itemId: string, data: Partial<{ quantity: number; pv: number; dp: number; productName: string; productCode: string; size: string; itemDate: string }>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  updateItemLocally: (itemId: string, data: Partial<PortfolioItem>) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  currentPortfolio: null,
  isLoading: false,
  error: null,

  fetchPortfolios: async (status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const portfolios = await api.portfolios.list(status);
      set({ portfolios, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchPortfolio: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const portfolio = await api.portfolios.get(id);
      set({ currentPortfolio: portfolio, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearCurrentPortfolio: () => {
    set({ currentPortfolio: null });
  },

  createPortfolio: async (data) => {
    try {
      const portfolio = await api.portfolios.create(data);
      set((state) => ({ portfolios: [portfolio, ...state.portfolios] }));
      return portfolio;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updatePortfolio: async (id, data) => {
    try {
      const portfolio = await api.portfolios.update(id, data);
      set((state) => ({
        portfolios: state.portfolios.map((p) => (p.id === id ? portfolio : p)),
        currentPortfolio: state.currentPortfolio?.id === id ? portfolio : state.currentPortfolio,
      }));
      return portfolio;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deletePortfolio: async (id) => {
    try {
      await api.portfolios.delete(id);
      set((state) => ({
        portfolios: state.portfolios.filter((p) => p.id !== id),
        currentPortfolio: state.currentPortfolio?.id === id ? null : state.currentPortfolio,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  duplicatePortfolio: async (id) => {
    try {
      const portfolio = await api.portfolios.duplicate(id);
      set((state) => ({ portfolios: [portfolio, ...state.portfolios] }));
      return portfolio;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addItem: async (portfolioId, productId, quantity, itemDate) => {
    try {
      const { item, portfolio } = await api.portfolioItems.add(portfolioId, { productId, quantity, itemDate });
      set((state) => ({
        currentPortfolio: portfolio,
        portfolios: state.portfolios.map((p) => (p.id === portfolioId ? portfolio : p)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateItem: async (itemId, data) => {
    try {
      const { item, portfolio } = await api.portfolioItems.update(itemId, data);
      set((state) => ({
        currentPortfolio: portfolio,
        portfolios: state.portfolios.map((p) => (p.id === portfolio.id ? portfolio : p)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteItem: async (itemId) => {
    try {
      const { portfolio } = await api.portfolioItems.delete(itemId);
      set((state) => ({
        currentPortfolio: portfolio,
        portfolios: state.portfolios.map((p) => (p.id === portfolio.id ? portfolio : p)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateItemLocally: (itemId, data) => {
    set((state) => {
      if (!state.currentPortfolio) return state;

      const items = state.currentPortfolio.items.map((item) => {
        if (item.id !== itemId) return item;

        const updatedItem = { ...item, ...data };
        if (data.quantity !== undefined || data.pv !== undefined || data.dp !== undefined) {
          const totals = calculateItemTotals(
            updatedItem.quantity,
            updatedItem.pv,
            updatedItem.dp
          );
          updatedItem.totalPV = totals.totalPV;
          updatedItem.totalPrice = totals.totalPrice;
        }

        return updatedItem;
      });

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const totalPV = items.reduce((sum, item) => sum + item.totalPV, 0);
      const vatAmount = subtotal * (state.currentPortfolio.vatPercent / 100);
      const grandTotal = subtotal + vatAmount;

      return {
        currentPortfolio: {
          ...state.currentPortfolio,
          items,
          subtotal: Math.round(subtotal * 100) / 100,
          vatAmount: Math.round(vatAmount * 100) / 100,
          grandTotal: Math.round(grandTotal * 100) / 100,
        },
      };
    });
  },
}));
