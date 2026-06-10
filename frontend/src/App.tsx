import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AppRoutes } from '@/routes';
import { antdTheme } from '@/styles/theme';
import 'react-toastify/dist/ReactToastify.css';

export function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={ptBR}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop />
      </BrowserRouter>
    </ConfigProvider>
  );
}
