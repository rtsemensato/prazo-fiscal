import {
  AlertOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Statistic, Typography } from 'antd';
import { PageLoader } from '@/components/PageLoader';
import { QueryErrorAlert } from '@/components/QueryErrorAlert';
import { useDashboardQuery } from '@/hooks/queries/useDashboardQuery';
import { brandColors } from '@/styles/theme';

const { Text } = Typography;

export function DashboardPage() {
  const { stats, loading, error } = useDashboardQuery();

  if (loading) return <PageLoader />;

  const cards = stats
    ? [
      {
        title: 'Total de Empresas',
        value: stats.totalCompanies,
        icon: <BankOutlined style={{ color: brandColors.primary }} />,
        color: brandColors.primary,
        testId: 'kpi-total-empresas',
      },
      {
        title: 'Obrigações do Mês',
        value: stats.monthObligations,
        icon: <FileTextOutlined style={{ color: brandColors.accent }} />,
        color: brandColors.accent,
        testId: 'kpi-obrigacoes-mes',
      },
      {
        title: 'Pendentes',
        value: stats.pendingCount,
        icon: <ClockCircleOutlined style={{ color: brandColors.warning }} />,
        color: brandColors.warning,
        testId: 'kpi-pendentes',
      },
      {
        title: 'Entregues',
        value: stats.deliveredCount,
        icon: <CheckCircleOutlined style={{ color: brandColors.success }} />,
        color: brandColors.success,
        testId: 'kpi-entregues',
      },
      {
        title: 'Atrasadas',
        value: stats.overdueCount,
        icon: <AlertOutlined style={{ color: brandColors.error }} />,
        color: brandColors.error,
        testId: 'kpi-atrasadas',
      },
    ]
    : [];

  // Denominador: apenas obrigações aplicáveis (exclui Não Aplicável)
  const applicable = stats
    ? stats.pendingCount + stats.deliveredCount + stats.overdueCount
    : 0;
  const pct = (n: number) =>
    applicable > 0 ? Math.round((n / applicable) * 100) : 0;

  const distribution = stats
    ? [
      {
        label: 'Entregues',
        value: stats.deliveredCount,
        percent: pct(stats.deliveredCount),
        color: brandColors.success,
      },
      {
        label: 'Pendentes',
        value: stats.pendingCount,
        percent: pct(stats.pendingCount),
        color: brandColors.warning,
      },
      {
        label: 'Atrasadas',
        value: stats.overdueCount,
        percent: pct(stats.overdueCount),
        color: brandColors.error,
      },
    ]
    : [];

  const deliveryRate = pct(stats?.deliveredCount ?? 0);
  const circleColor =
    deliveryRate === 100
      ? brandColors.success
      : deliveryRate > 50
        ? brandColors.accent
        : brandColors.warning;

  return (
    <div>
      <QueryErrorAlert error={error} />
      {stats && (
        <>
          {/* Linha 1 — KPIs */}
          <Row gutter={[16, 16]}>
            {cards.map((card) => (
              <Col
                key={card.title}
                xs={24}
                sm={12}
                lg={8}
                xl={cards.length === 5 ? undefined : 6}
              >
                <Card
                  data-testid={card.testId}
                  bordered={false}
                  style={{ borderTop: `3px solid ${card.color}` }}
                >
                  <Statistic title={card.title} value={card.value} prefix={card.icon} />
                </Card>
              </Col>
            ))}
          </Row>

          {/* Linha 2 — Distribuição e taxa de entrega */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card
                title="Distribuição das Obrigações — Mês Atual"
                bordered={false}
                style={{ height: '100%' }}
              >
                {applicable === 0 ? (
                  <Text type="secondary">Nenhuma obrigação aplicável no mês atual.</Text>
                ) : (
                  distribution.map((item) => (
                    <div key={item.label} style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <Text strong style={{ color: item.color }}>
                          {item.label}
                        </Text>
                        <Text type="secondary">
                          {item.value} obrigaç{item.value !== 1 ? 'ões' : 'ão'} · {item.percent}%
                        </Text>
                      </div>
                      <Progress
                        percent={item.percent}
                        strokeColor={item.color}
                        trailColor="#f0f0f0"
                        showInfo={false}
                        size={['100%', 10]}
                      />
                    </div>
                  ))
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title="Taxa de Entrega"
                bordered={false}
                style={{ height: '100%', textAlign: 'center' }}
              >
                <div style={{ padding: '16px 0' }}>
                  <Progress
                    type="circle"
                    percent={deliveryRate}
                    strokeColor={circleColor}
                    size={140}
                    format={(p) => (
                      <div>
                        <div
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            color: circleColor,
                          }}
                        >
                          {p}%
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                          entregues
                        </div>
                      </div>
                    )}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {stats.deliveredCount} de {applicable} obrigaç
                  {applicable !== 1 ? 'ões' : 'ão'} aplicáve
                  {applicable !== 1 ? 'is' : 'l'}
                </Text>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
