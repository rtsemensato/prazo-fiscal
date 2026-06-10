import { CheckOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { ObligationStatusBadge } from '@/components/ObligationStatusBadge';
import { PageLoader } from '@/components/PageLoader';
import { QueryErrorAlert } from '@/components/QueryErrorAlert';
import { useAlertsQuery } from '@/hooks/queries/useAlertsQuery';
import { useDeliveryMutation } from '@/hooks/queries/useDeliveryMutation';
import {
  OBLIGATION_TYPE_LABELS,
  ObligationStatus,
  type ObligationWithId,
} from '@/models/obligation';
import { DeliveryModal } from '@/pages/Calendar/components/DeliveryModal';
import { daysUntil, formatDate } from '@/utils/dates';
import { brandColors } from '@/styles/theme';
import { extractInlineMessages } from '@/utils/errorHandling';

export function AlertsPage() {
  const { upcoming, overdue, loading, error } = useAlertsQuery();

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedObligationId, setSelectedObligationId] = useState<string>();

  const deliveryMutation = useDeliveryMutation(() => setDeliveryModalOpen(false));

  const deliveryErrors = useMemo(
    () => extractInlineMessages(deliveryMutation.error),
    [deliveryMutation.error],
  );

  const columns: ColumnsType<ObligationWithId> = useMemo(
    () => [
      {
        title: 'Empresa',
        dataIndex: 'companyName',
        key: 'companyName',
      },
      {
        title: 'Obrigação',
        dataIndex: 'type',
        key: 'type',
        render: (value: ObligationWithId['type']) => OBLIGATION_TYPE_LABELS[value],
      },
      {
        title: 'Vencimento',
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: (value: string) => formatDate(value),
      },
      {
        title: 'Urgência',
        key: 'urgency',
        render: (_, record) => {
          const days = daysUntil(record.dueDate);
          if (days < 0) {
            return `${Math.abs(days)} dia(s) de atraso`;
          }
          if (days === 0) {
            return 'Vence hoje';
          }
          return `Em ${days} dia(s)`;
        },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: ObligationStatus) => <ObligationStatusBadge status={value} />,
      },
      {
        title: 'Ações',
        key: 'actions',
        render: (_, record) =>
          record.status !== ObligationStatus.Delivered &&
          record.status !== ObligationStatus.NotApplicable ? (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => {
                deliveryMutation.reset();
                setSelectedObligationId(record.id);
                setDeliveryModalOpen(true);
              }}
            >
              Marcar Entregue
            </Button>
          ) : null,
      },
    ],
    [deliveryMutation],
  );

  const handleDeliveryConfirm = (deliveredAt: string) => {
    if (!selectedObligationId) return;
    deliveryMutation.mutate({ obligationId: selectedObligationId, deliveredAt });
  };

  const handleDeliveryCancel = () => {
    setDeliveryModalOpen(false);
    deliveryMutation.reset();
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <QueryErrorAlert error={error} />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title="Vencendo nos próximos 30 dias"
          style={{ borderTop: `3px solid ${brandColors.warning}` }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={upcoming}
            pagination={false}
            locale={{ emptyText: 'Nenhuma obrigação vencendo nos próximos 30 dias.' }}
          />
        </Card>

        <Card title="Atrasadas" style={{ borderTop: `3px solid ${brandColors.error}` }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={overdue}
            pagination={false}
            locale={{ emptyText: 'Nenhuma obrigação atrasada.' }}
          />
        </Card>
      </Space>

      <DeliveryModal
        open={deliveryModalOpen}
        loading={deliveryMutation.isPending}
        onCancel={handleDeliveryCancel}
        onConfirm={handleDeliveryConfirm}
        errors={deliveryErrors}
      />
    </>
  );
}
