import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AlertsPage } from '@/pages/Alerts';
import { CalendarPage } from '@/pages/Calendar';
import { CompaniesPage } from '@/pages/Companies';
import { DashboardPage } from '@/pages/Dashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="empresas" element={<CompaniesPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="alertas" element={<AlertsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
