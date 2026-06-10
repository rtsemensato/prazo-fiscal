import { Badge, Layout, Menu, Typography } from 'antd';
import {
  AlertOutlined,
  BankOutlined,
  CalendarOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAlertsQuery } from '@/hooks/queries/useAlertsQuery';
import { brandColors } from '@/styles/theme';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { overdue } = useAlertsQuery();

  const selectedKey = useMemo(() => {
    if (location.pathname === '/') return '/';
    const routes = ['/empresas', '/calendario', '/alertas'];
    const match = routes.find((route) => location.pathname.startsWith(route));
    return match ?? '/';
  }, [location.pathname]);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/empresas', icon: <BankOutlined />, label: 'Empresas' },
    { key: '/calendario', icon: <CalendarOutlined />, label: 'Calendário' },
    {
      key: '/alertas',
      icon: <AlertOutlined />,
      label: (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'inherit',
          }}
        >
          Alertas
          {overdue.length > 0 && (
            <Badge count={overdue.length} size="small" overflowCount={99} />
          )}
        </span>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64} width={240}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 0.5,
          }}
        >
          PrazoFiscal
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: brandColors.navy }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #E8EDF3',
          }}
        >
          <Typography.Title level={4} style={{ margin: 0, color: brandColors.navy }}>
            Painel de Obrigações Acessórias
          </Typography.Title>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
