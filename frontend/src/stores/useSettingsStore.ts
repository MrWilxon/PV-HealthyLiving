import { create } from 'zustand';
import { Settings } from '@/types';
import { api } from '@/lib/api';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await api.settings.get();
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateSettings: async (data) => {
    try {
      const settings = await api.settings.update(data);
      set({ settings });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));
