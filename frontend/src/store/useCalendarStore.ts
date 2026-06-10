import { create } from 'zustand';
import type { ObligationStatus } from '@/models/obligation';
import { dayjs } from '@/utils/dates';

interface CalendarState {
  companyId?: string;
  month: number;
  year: number;
  statusFilter?: ObligationStatus;
  setCompanyId: (companyId?: string) => void;
  setMonthYear: (month: number, year: number) => void;
  setStatusFilter: (status?: ObligationStatus) => void;
  resetFilters: () => void;
}

const now = dayjs();

export const useCalendarStore = create<CalendarState>((set) => ({
  companyId: undefined,
  month: now.month() + 1,
  year: now.year(),
  statusFilter: undefined,
  setCompanyId: (companyId) => set({ companyId }),
  setMonthYear: (month, year) => set({ month, year }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () => {
    const today = dayjs();
    set({ companyId: undefined, month: today.month() + 1, year: today.year(), statusFilter: undefined });
  },
}));
