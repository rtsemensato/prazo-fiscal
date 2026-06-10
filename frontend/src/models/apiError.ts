/**
 * Estrutura do ProblemDetails retornado pela API (RFC 7807).
 * Todos os erros 4xx e 5xx seguem esse formato.
 */
export interface ProblemDetails {
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

/**
 * Erro tipado que encapsula a resposta ProblemDetails da API.
 * Substituí o AxiosError genérico para que qualquer camada da aplicação
 * consiga inspecionar o tipo e a mensagem do erro sem depender do Axios.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    title: string,
    detail?: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(detail ?? title);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }

  /**
   * 422 com erros de campo vindos do FluentValidation.
   * Ex: { errors: { DeliveredAt: ["A data de entrega não pode ser futura."] } }
   */
  get isValidation(): boolean {
    return this.status === 422 && !!this.fieldErrors && Object.keys(this.fieldErrors).length > 0;
  }

  /**
   * Violação de regra de negócio — exibida inline no modal, sem toast.
   * - 422 sem errors de campo (FluentValidation não encontrou campo específico)
   * - 409 Conflict: mapeado de InvalidOperationException no AppExceptionHandler
   *   Ex: "Esta obrigação não se aplica ao regime tributário da empresa."
   */
  get isBusinessRule(): boolean {
    return (this.status === 422 && !this.isValidation) || this.status === 409;
  }

  /** Lista achatada de todas as mensagens de campo (FluentValidation). */
  get validationMessages(): string[] {
    if (!this.fieldErrors) return [];
    return Object.values(this.fieldErrors).flat();
  }

  /** Melhor mensagem única para exibir ao usuário. */
  get userMessage(): string {
    if (this.isValidation && this.validationMessages.length > 0) {
      return this.validationMessages[0];
    }
    return this.detail ?? this.title ?? 'Erro inesperado.';
  }
}
