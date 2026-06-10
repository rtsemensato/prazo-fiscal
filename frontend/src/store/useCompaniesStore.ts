import { create } from 'zustand';

interface CompaniesState {
  search: string;
  setSearch: (search: string) => void;
  clearSearch: () => void;
}

export const useCompaniesStore = create<CompaniesState>((set) => ({
  search: '',
  setSearch: (search) => set({ search }),
  clearSearch: () => set({ search: '' }),
}));
