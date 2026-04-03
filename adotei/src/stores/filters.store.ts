import { create } from 'zustand';
import { PetFilters } from '../types';

interface FiltersState {
  filters: PetFilters;
  setFilter: <K extends keyof PetFilters>(key: K, value: PetFilters[K]) => void;
  clearFilters: () => void;
  activeCount: () => number;
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: {},
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: () => set({ filters: {} }),
  activeCount: () => Object.values(get().filters).filter((v) => v !== undefined && v !== '').length,
}));
