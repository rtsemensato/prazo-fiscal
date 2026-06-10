# CLAUDE.md — PrazoFiscal

Diretrizes técnicas do projeto. Leia antes de qualquer alteração.

## Arquitetura em uma linha

`ObligationEngine` (pura) → `Services` (orquestração + EF Core) → `Endpoints` (Minimal API) → `fiscalService` (Axios + hooks) → `Pages` (React)

---

## Backend

### Regras invioláveis

**DateTime sempre UTC.**
O Npgsql rejeita `Kind=Unspecified` em colunas `timestamp with time zone`. Todo `DateTime` criado no código deve ser explicitamente UTC:

```csharp
// correto
DateTime.UtcNow
DateTime.SpecifyKind(value, DateTimeKind.Utc)

// nunca
new DateTime(2026, 1, 1)         // Kind=Unspecified — quebra no Npgsql
DateTime.Now                      // Kind=Local — idem
```

**`ObligationEngine` é pura.** Nenhuma dependência de EF Core, serviços ou I/O. Só recebe dados e retorna dados. Testes unitários dependem disso.

**Formato do `obligationId` é determinístico:**
```
{companyId}-{tipoCamelCase}-{competenceMonth}-{competenceYear}
```
Ex.: `11111111-...-esocial-6-2026`. Gerado em `ObligationEngine.BuildObligationId()` via `JsonNamingPolicy.CamelCase`. Nunca construa o ID manualmente em outro lugar.

**Erros saem via exceção, não via result types.** Os services lançam:
- `KeyNotFoundException` → 404
- `InvalidOperationException` → 409 Conflict (regras de negócio: CNPJ duplicado, regime incompatível)
- `ApiValidationException` → 422 com `errors` por campo (criada pelo `ValidateOrThrowAsync`)

O `AppExceptionHandler` centraliza o mapeamento para ProblemDetails RFC 7807. Não invente novos padrões de retorno.

**Resposta de sucesso:** `{ success: true, message?, data }` via helper `ApiResponse`. Nunca retorne o objeto de domínio diretamente.

### Convenções

- Endpoints agrupados em `FeatureEndpoints.cs` por feature; não crie um arquivo por endpoint.
- Validators FluentValidation ficam em `DTOs/<Feature>/Validators/`.
- Seed é idempotente: `if (await dbContext.Companies.AnyAsync()) return;` — nunca remova essa guarda.
- `AsNoTracking()` em todas as queries somente-leitura.
- `Include()` carrega relacionamentos em uma única query; nunca carregue empresas e depois entregas em loop (N+1).

---

## Frontend

### Tratamento de erros — contrato fixo

O interceptor em `client.ts` converte toda resposta de erro em `ApiError` antes de propagar. Mutations e queries **nunca** recebem `AxiosError` diretamente.

Categorização por tipo de erro:

| Condição | `ApiError` | Onde exibir |
|---|---|---|
| `isValidation` (422 + `fieldErrors`) | FluentValidation por campo | Inline no modal via `<FormErrorAlert>` |
| `isBusinessRule` (422 sem campos ou 409) | Regra de negócio violada | Inline no modal via `<FormErrorAlert>` |
| 404 / 500 / rede | Erro de infraestrutura | `toast.error(error.userMessage)` |

Sempre chame `mutation.reset()` ao fechar o modal (cancel) ou ao abrir um novo — sem isso, o erro da tentativa anterior reaparece.

### Estrutura de arquivos

```
src/
├── api/fiscalService/      # axios client + funções de I/O — sem lógica de negócio
├── hooks/queries/          # um hook por recurso (useCalendarQuery, useDeliveryMutation…)
├── models/                 # tipos TypeScript puros — sem lógica
├── store/                  # Zustand — apenas estado de UI (filtros, modais)
├── pages/<Feature>/        # componente de página
│   └── components/         # subcomponentes específicos da página (co-localizados)
├── components/             # componentes verdadeiramente reutilizáveis entre páginas
└── utils/                  # funções puras (cnpj, dates, errorHandling)
```

Regra de ouro: se um componente só é usado em uma página, fica em `pages/<Feature>/components/`, não em `components/`.

### Cores e tema

Nunca hardcode valores hexadecimais no JSX/TSX. Use sempre:

```ts
import { brandColors } from '@/styles/theme';

// correto
style={{ borderTop: `3px solid ${brandColors.accent}` }}

// nunca
style={{ borderTop: '3px solid #00ACC1' }}
```

O `ConfigProvider` do Ant Design aplica `antdTheme` globalmente. Não sobrescreva tokens do tema inline.

### TanStack Query

- `queryKeys` é o único lugar onde as chaves são definidas — nunca use strings literais em `useQuery`/`useMutation`.
- Filtros do calendário vivem no `useCalendarStore` (Zustand); o hook `useCalendarQuery` lê o store diretamente. Não passe filtros como props para o hook.
- `invalidateQueries` após mutation deve usar a mesma factory: `queryKeys.calendar(...)`, não strings.

---

## Testes

### Backend

- Testes de integração usam PostgreSQL real via Testcontainers. **Nunca mocke o banco.**
- CNPJs nos testes precisam ser matematicamente válidos (algoritmo de dígitos verificadores). CNPJs inválidos fazem o validator rejeitar antes de chegar ao banco.
- `IClassFixture<ApiIntegrationFixture>` compartilha o container entre todos os testes da classe — cada teste que cria dados próprios deve usar um CNPJ único para não conflitar com o seed.
- Testes unitários da `ObligationEngine` usam datas concretas (`new DateOnly(2026, ...)`) e um `referenceDate` explícito — nunca `DateTime.UtcNow` em asserções de data.

### Frontend

- API mockada com `vi.mock('@/api/fiscalService/...')` — isola componentes da rede.
- `QueryClientProvider` e `ConfigProvider` reais via `renderWithProviders` em `src/test/renderWithProviders.tsx`. Não crie um wrapper alternativo.
- Acesse elementos por `data-testid` quando o texto é ambíguo (ex.: "Pendentes" aparece em KPI cards e no gráfico). IDs existentes: `kpi-pendentes`, `kpi-entregues`, `kpi-atrasadas`, `calendar-table`.

---

## Decisões que não devem ser revisitadas sem justificativa

| Decisão | Onde está documentado |
|---|---|
| Paginação client-side no calendário (não server-side) | README > Paginação no calendário |
| `GetDeliveriesAsync` chama `Generate()` por entrega, não agrupado | README > Histórico de entregas |
| Sem Repository pattern | README > Por que sem repositório |
| `obligationRules.ts` no frontend duplica a engine (modo mock) | README > Regras de negócio duplicadas |
| Busca explícita (Enter/lupa), sem debounce | README > Uso de IA > Decisão de UX |

Se alguma dessas decisões precisar ser revertida, atualize o README junto.

---

## O que evitar

- **Comentários que explicam o quê** — o nome do método já faz isso. Comente apenas o *porquê* quando há restrição não óbvia (timezone, workaround de lib, invariante sutil).
- **Abstrações prematuras** — três implementações similares não justificam extração. Extraia quando a quarta aparecer com necessidade real de reúso.
- **Validação de cenários impossíveis** — confie nos contratos internos. Valide apenas em fronteiras do sistema (entrada do usuário, resposta de API externa).
- **`DateTime.Now` ou `new DateTime()` sem Kind** — sempre UTC, sem exceção.
- **Cores e tokens de tema inline** — use `brandColors` e os tokens do `ConfigProvider`.
