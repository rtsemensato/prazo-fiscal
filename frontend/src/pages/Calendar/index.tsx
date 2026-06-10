import { CheckOutlined, CloseCircleOutlined, DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useMemo, useState } from 'react';
import { buildCalendarExportUrl, buildCalendarPdfExportUrl } from '@/api/fiscalService/obligations';
import { ObligationStatusBadge } from '@/components/ObligationStatusBadge';
import { QueryErrorAlert } from '@/components/QueryErrorAlert';
import { useCalendarQuery } from '@/hooks/queries/useCalendarQuery';
import { useCompaniesList } from '@/hooks/queries/useCompaniesList';
import { useDeliveryMutation } from '@/hooks/queries/useDeliveryMutation';
import {
  OBLIGATION_PERIODICITY_LABELS,
  OBLIGATION_STATUS_OPTIONS,
  OBLIGATION_TYPE_LABELS,
  ObligationStatus,
  type ObligationWithId,
} from '@/models/obligation';
import { DeliveryModal } from '@/pages/Calendar/components/DeliveryModal';
import { useCalendarStore } from '@/store/useCalendarStore';
import { brandColors } from '@/styles/theme';
import { formatDate } from '@/utils/dates';
import { extractInlineMessages } from '@/utils/errorHandling';

dayjs.locale('pt-br');

export function CalendarPage() {
  const companyId = useCalendarStore((state) => state.companyId);
  const month = useCalendarStore((state) => state.month);
  const year = useCalendarStore((state) => state.year);
  const statusFilter = useCalendarStore((state) => state.statusFilter);
  const setCompanyId = useCalendarStore((state) => state.setCompanyId);
  const setMonthYear = useCalendarStore((state) => state.setMonthYear);
  const setStatusFilter = useCalendarStore((state) => state.setStatusFilter);
  const resetFilters = useCalendarStore((state) => state.resetFilters);

  const today = dayjs();
  const hasActiveFilters =
    !!companyId ||
    !!statusFilter ||
    month !== today.month() + 1 ||
    year !== today.year();

  const { companies } = useCompaniesList();
  const { obligations, loading, error } = useCalendarQuery();
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedObligationId, setSelectedObligationId] = useState<string>();

  const deliveryMutation = useDeliveryMutation(() => setDeliveryModalOpen(false));

  // Extrai mensagens de erro 422 (validação/regra de negócio) para exibir inline no modal.
  // Para 404/500, deliveryMutation.onError já dispara o toast.
  const deliveryErrors = useMemo(
    () => extractInlineMessages(deliveryMutation.error),
    [deliveryMutation.error],
  );

  const companyOptions = useMemo(
    () => [
      { value: '', label: 'Todas as empresas' },
      ...companies.map((company) => ({ value: company.id, label: company.name })),
    ],
    [companies],
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
        title: 'Periodicidade',
        dataIndex: 'periodicity',
        key: 'periodicity',
        render: (value: ObligationWithId['periodicity']) => OBLIGATION_PERIODICITY_LABELS[value],
      },
      {
        title: 'Competência',
        key: 'competence',
        render: (_, record) => `${String(record.competenceMonth).padStart(2, '0')}/${record.competenceYear}`,
      },
      {
        title: 'Vencimento',
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: (value: string) => formatDate(value),
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
                deliveryMutation.reset(); // limpa erro de tentativa anterior
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
    deliveryMutation.reset(); // limpa erro ao fechar sem confirmar
  };

  const exportFilter = { month, year, companyId, status: statusFilter };

  const handleExportCsv = () => {
    window.open(buildCalendarExportUrl(exportFilter), '_blank');
  };

  const handleExportPdf = () => {
    window.open(buildCalendarPdfExportUrl(exportFilter), '_blank');
  };

  return (
    <>
      <Card title="Calendário de Obrigações" style={{ borderTop: `3px solid ${brandColors.accent}` }}>
        <QueryErrorAlert error={error} />

        <Space wrap style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Select
              placeholder="Empresa"
              style={{ minWidth: 260 }}
              value={companyId ?? ''}
              options={companyOptions}
              onChange={(value) => setCompanyId(value || undefined)}
            />

            <DatePicker
              picker="month"
              value={dayjs()
                .year(year)
                .month(month - 1)}
              onChange={(value) => {
                if (!value) return;
                setMonthYear(value.month() + 1, value.year());
              }}
              format="MMMM [de] YYYY"
            />

            <Select
              allowClear
              placeholder="Filtrar por status"
              style={{ minWidth: 200 }}
              value={statusFilter}
              options={OBLIGATION_STATUS_OPTIONS}
              onChange={(value) => setStatusFilter(value)}
            />

            <Button
              icon={<CloseCircleOutlined />}
              disabled={!hasActiveFilters}
              onClick={resetFilters}
            >
              Limpar filtros
            </Button>
          </Space>

          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              Exportar CSV
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={handleExportPdf} danger>
              Exportar PDF
            </Button>
          </Space>
        </Space>

        <Table
          data-testid="calendar-table"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={obligations}
          pagination={{ pageSize: 15, showSizeChanger: false }}
        />
      </Card>

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
