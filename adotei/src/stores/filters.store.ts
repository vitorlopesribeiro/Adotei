import { create } from 'zustand';
import { PetFilters } from '../types';

interface FiltersState {
  filters: PetFilters;
  setFilter: <K extends keyof PetFilters>(key: K, value: PetFilters[K]) => void;
  clearFilters: () => void;
  activeCount: () => number;
}

// Store global de filtros do catálogo (Zustand)
// Persiste os filtros entre navegações dentro das tabs
export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: {},
  // Atualiza um filtro individual (ex: espécie, sexo, porte)
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  // Limpa todos os filtros ativos
  clearFilters: () => set({ filters: {} }),
  // Conta quantos filtros estão ativos (para exibir badge no botão)
  activeCount: () => Object.values(get().filters).filter((v) => v !== undefined && v !== '').length,
}));
