import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormErrorAlert } from '@/components/FormErrorAlert';
import {
  TaxRegime,
  TAX_REGIME_OPTIONS,
  type CompanyFormData,
  type CompanyWithId,
} from '@/models/company';
import { formatCnpj, isValidCNPJ, stripCnpj } from '@/utils/cnpj';

const companySchema = z.object({
  name: z.string().min(3, 'Informe a razão social com pelo menos 3 caracteres.'),
  cnpj: z
    .string()
    .min(14, 'Informe um CNPJ válido.')
    .refine((value) => isValidCNPJ(value), 'CNPJ inválido.'),
  taxRegime: z.nativeEnum(TaxRegime),
});

interface CompanyFormModalProps {
  open: boolean;
  company?: CompanyWithId;
  loading: boolean;
  /** Mensagens de erro vindas da API (ex: CNPJ já cadastrado). Exibidas acima do formulário. */
  apiErrors?: string[];
  onCancel: () => void;
  onSubmit: (data: CompanyFormData) => void;
}

export function CompanyFormModal({ open, company, loading, apiErrors, onCancel, onSubmit }: CompanyFormModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      cnpj: '',
      taxRegime: TaxRegime.SimplesNacional,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        company
          ? {
              name: company.name,
              cnpj: formatCnpj(company.cnpj),
              taxRegime: company.taxRegime,
            }
          : {
              name: '',
              cnpj: '',
              taxRegime: TaxRegime.SimplesNacional,
            },
      );
    }
  }, [company, open, reset]);

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      ...data,
      cnpj: stripCnpj(data.cnpj),
    });
  });

  return (
    <Modal
      title={company ? 'Editar Empresa' : 'Nova Empresa'}
      open={open}
      onCancel={onCancel}
      onOk={handleFormSubmit}
      okText="Salvar"
      cancelText="Cancelar"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form layout="vertical" onFinish={handleFormSubmit}>
        <FormErrorAlert errors={apiErrors} />

        <Form.Item
          label="Razão Social*"
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Nome da empresa" />}
          />
        </Form.Item>

        <Form.Item
          label="CNPJ*"
          validateStatus={errors.cnpj ? 'error' : undefined}
          help={errors.cnpj?.message}
        >
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                onChange={(event) => field.onChange(formatCnpj(event.target.value))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Regime Tributário*"
          validateStatus={errors.taxRegime ? 'error' : undefined}
          help={errors.taxRegime?.message}
        >
          <Controller
            name="taxRegime"
            control={control}
            render={({ field }) => (
              <Select {...field} options={TAX_REGIME_OPTIONS} placeholder="Selecione o regime" />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
