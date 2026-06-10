import { Alert } from 'antd';

interface FormErrorAlertProps {
  errors?: string[];
}

/**
 * Alert de erro para uso dentro de modais e formulários.
 * Exibe uma lista de mensagens de erro da API (validação ou regra de negócio)
 * diretamente no contexto da ação, sem interromper o fluxo com um toast.
 */
export function FormErrorAlert({ errors }: FormErrorAlertProps) {
  if (!errors || errors.length === 0) return null;

  return (
    <Alert
      type="error"
      showIcon
      message={
        errors.length === 1 ? (
          errors[0]
        ) : (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )
      }
      style={{ marginBottom: 16 }}
    />
  );
}
