import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1565C0',
    colorSuccess: '#2E7D32',
    colorWarning: '#F57F17',
    colorError: '#C62828',
    colorInfo: '#00ACC1',
    colorBgLayout: '#F5F7FA',
    borderRadius: 8,
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#0D1B2A',
      triggerBg: '#0D1B2A',
    },
    Menu: {
      darkItemBg: '#0D1B2A',
      darkSubMenuItemBg: '#0D1B2A',
    },
  },
};

export const brandColors = {
  primary: '#1565C0',
  primaryHover: '#1E88E5',
  accent: '#00ACC1',
  navy: '#0D1B2A',
  success: '#2E7D32',
  warning: '#F57F17',
  error: '#C62828',
  surface: '#F5F7FA',
};
