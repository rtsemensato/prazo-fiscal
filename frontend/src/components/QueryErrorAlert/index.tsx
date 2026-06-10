import { Alert } from 'antd';

interface QueryErrorAlertProps {
  error: unknown;
}

export function QueryErrorAlert({ error }: QueryErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert
      type="error"
      showIcon
      message="Não foi possível carregar os dados."
      style={{ marginBottom: 16 }}
    />
  );
}
