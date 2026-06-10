import { DeleteOutlined, EditOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { QueryErrorAlert } from '@/components/QueryErrorAlert';
import {
  useCreateCompanyMutation,
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
} from '@/hooks/queries/useCompanyMutation';
import { useCompaniesList } from '@/hooks/queries/useCompaniesList';
import { TAX_REGIME_LABELS, type CompanyFormData, type CompanyWithId } from '@/models/company';
import { CompanyFormModal } from '@/pages/Companies/components/CompanyFormModal';
import { DeliveryHistoryDrawer } from '@/pages/Companies/components/DeliveryHistoryDrawer';
import { useCompaniesStore } from '@/store/useCompaniesStore';
import { brandColors } from '@/styles/theme';
import { formatCnpj } from '@/utils/cnpj';
import { extractInlineMessages } from '@/utils/errorHandling';

export function CompaniesPage() {
  const search = useCompaniesStore((state) => state.search);
  const setSearch = useCompaniesStore((state) => state.setSearch);
  const clearSearch = useCompaniesStore((state) => state.clearSearch);
  const { companies, loading, error } = useCompaniesList();

  const [inputValue, setInputValue] = useState(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithId>();
  const [historyCompany, setHistoryCompany] = useState<CompanyWithId>();

  const createMutation = useCreateCompanyMutation(() => closeModal());
  const updateMutation = useUpdateCompanyMutation(() => closeModal());
  const deleteMutation = useDeleteCompanyMutation();

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCompany(undefined);
    createMutation.reset();
    updateMutation.reset();
  };

  // Erros 422 da mutation ativa — exibidos inline dentro do modal de empresa
  const activeApiErrors = useMemo(
    () => extractInlineMessages(selectedCompany ? updateMutation.error : createMutation.error),
    [selectedCompany, createMutation.error, updateMutation.error],
  );

  const handleSubmit = (data: CompanyFormData) => {
    if (selectedCompany) {
      updateMutation.mutate({ id: selectedCompany.id, data });
      return;
    }

    createMutation.mutate(data);
  };

  const columns: ColumnsType<CompanyWithId> = useMemo(
    () => [
      {
        title: 'Razão Social',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'CNPJ',
        dataIndex: 'cnpj',
        key: 'cnpj',
        render: (value: string) => formatCnpj(value),
      },
      {
        title: 'Regime Tributário',
        dataIndex: 'taxRegime',
        key: 'taxRegime',
        render: (value: CompanyWithId['taxRegime']) => TAX_REGIME_LABELS[value],
      },
      {
        title: 'Ações',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button
              type="link"
              icon={<HistoryOutlined />}
              onClick={() => {
                setHistoryCompany(record);
                setHistoryOpen(true);
              }}
            >
              Ver histórico
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedCompany(record);
                setModalOpen(true);
              }}
            >
              Editar
            </Button>
            <Popconfirm
              title="Remover empresa?"
              description="Esta ação não pode ser desfeita."
              okText="Remover"
              cancelText="Cancelar"
              onConfirm={() => deleteMutation.mutate(record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Excluir
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <>
      <Card
        title="Empresas"
        style={{ borderTop: `3px solid ${brandColors.primary}` }}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedCompany(undefined);
              createMutation.reset();
              setModalOpen(true);
            }}
          >
            Nova Empresa
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <QueryErrorAlert error={error} />

          <Input.Search
            placeholder="Buscar por razão social ou CNPJ"
            allowClear
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onSearch={(value) => setSearch(value)}
            onClear={() => {
              setInputValue('');
              clearSearch();
            }}
            style={{ maxWidth: 420 }}
          />

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={companies}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        </Space>
      </Card>

      <CompanyFormModal
        open={modalOpen}
        company={selectedCompany}
        loading={createMutation.isPending || updateMutation.isPending}
        apiErrors={activeApiErrors}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />

      <DeliveryHistoryDrawer
        company={historyCompany}
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryCompany(undefined);
        }}
      />
    </>
  );
}
