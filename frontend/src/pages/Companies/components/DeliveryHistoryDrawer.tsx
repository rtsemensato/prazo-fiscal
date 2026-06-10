import { Drawer, Empty, Spin, Timeline } from 'antd';
import { ObligationStatusBadge } from '@/components/ObligationStatusBadge';
import { QueryErrorAlert } from '@/components/QueryErrorAlert';
import { useCompanyDeliveriesQuery } from '@/hooks/queries/useCompanyDeliveriesQuery';
import type { CompanyWithId } from '@/models/company';
import { OBLIGATION_PERIODICITY_LABELS, OBLIGATION_TYPE_LABELS } from '@/models/obligation';
import { formatDate } from '@/utils/dates';

interface DeliveryHistoryDrawerProps {
  company?: CompanyWithId;
  open: boolean;
  onClose: () => void;
}

export function DeliveryHistoryDrawer({ company, open, onClose }: DeliveryHistoryDrawerProps) {
  const { deliveries, loading, error } = useCompanyDeliveriesQuery(company?.id);

  return (
    <Drawer
      title={company ? `Histórico — ${company.name}` : 'Histórico de entregas'}
      open={open}
      onClose={onClose}
      width={520}
      destroyOnHidden
    >
      <QueryErrorAlert error={error} />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : deliveries.length === 0 ? (
        <Empty description="Nenhuma entrega registrada para esta empresa." />
      ) : (
        <Timeline
          items={deliveries.map((delivery) => ({
            color: 'green',
            children: (
              <div>
                <strong>{OBLIGATION_TYPE_LABELS[delivery.type]}</strong>
                <div>
                  Competência: {String(delivery.competenceMonth).padStart(2, '0')}/{delivery.competenceYear}
                </div>
                <div>Periodicidade: {OBLIGATION_PERIODICITY_LABELS[delivery.periodicity]}</div>
                <div>Vencimento: {formatDate(delivery.dueDate)}</div>
                <div>Entregue em: {formatDate(delivery.deliveredAt)}</div>
                <div style={{ marginTop: 8 }}>
                  <ObligationStatusBadge status={delivery.status} />
                </div>
              </div>
            ),
          }))}
        />
      )}
    </Drawer>
  );
}
