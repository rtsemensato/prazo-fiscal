import { DatePicker, Form, Modal } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { FormErrorAlert } from '@/components/FormErrorAlert';

interface DeliveryModalProps {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (deliveredAt: string) => void;
  /** Mensagens de erro da API (validação ou regra de negócio) para exibição inline. */
  errors?: string[];
}

export function DeliveryModal({ open, loading, onCancel, onConfirm, errors }: DeliveryModalProps) {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  useEffect(() => {
    if (open) {
      setSelectedDate(dayjs());
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(selectedDate.format('YYYY-MM-DD'));
  };

  return (
    <Modal
      title="Registrar Entrega"
      open={open}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText="Confirmar"
      cancelText="Cancelar"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form layout="vertical">
        <FormErrorAlert errors={errors} />

        <Form.Item label="Data de conclusão*">
          <DatePicker
            value={selectedDate}
            onChange={(value) => value && setSelectedDate(value)}
            format="DD/MM/YYYY"
            style={{ width: '100%' }}
            disabledDate={(current) => current.isAfter(dayjs(), 'day')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
