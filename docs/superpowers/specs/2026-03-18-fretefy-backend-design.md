# Fretefy Plenobras — Backend Design Spec

## Overview

Sistema de integração entre ERP Plenobras e API Fretefy para gestão de fretes. Foco nesta fase: infraestrutura backend completa, sem UI final.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16, Node 22, TypeScript |
| Estilo | Tailwind CSS + shadcn/ui (preparado, sem design final) |
| Comunicação client-server | tRPC 11 |
| ORM | Drizzle (SQL Server via `tedious`) |
| Autenticacao | NextAuth v5 (credentials provider + JWT) |
| Agendamento | Dkron (Docker) |
| Deploy | Docker |
| Ambientes | DEV / PRD (env vars separadas) |

## Arquitetura

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  ERP (MSSQL) │──────>│   Next.js    │──────>│ Fretefy API │
│  (read-only) │  SQL  │   App        │  REST │             │
└─────────────┘       │              │       └──────┬──────┘
                      │  /api/webhooks│<─────────────┘
                      │  /api/cron/*  │<──── Dkron (HTTP callback)
                      └──────────────┘
```

### Fluxos

1. **ERP (SQL Server)** — leitura direta via Drizzle para buscar motoristas e veiculos
2. **Fretefy API** — REST client para tracking, motoristas, veiculos
3. **Webhooks** — endpoint publico que Fretefy chama para notificar eventos de carga
4. **Dkron** — chama endpoints de cron para sincronizacao periodica ERP -> Fretefy

## Contratos de Dados

### ERP — Tabelas SQL Server (read-only)

> **Prerequisito de implementacao:** As colunas exatas serao obtidas via `drizzle-kit introspect` conectando ao banco ERP. O desenvolvedor precisa de acesso ao banco DEV para executar o introspect antes de implementar os schemas e o mapeamento de campos.

**MDFeMotoristas**
- Tabela de motoristas do ERP
- Campos esperados minimos: documento (CPF), nome, CNH, celular
- Mapeamento ERP -> Fretefy sera definido apos introspect:
  - `documento` -> `documento` (CPF)
  - `nome` -> `nome`
  - campo CNH -> `numeroCNH`
  - campo celular -> `celular`

**MDFeVeiculos**
- Tabela de veiculos do ERP
- Campos esperados minimos: placa, RNTRC, tipo veiculo, tipo carroceria
- Mapeamento ERP -> Fretefy sera definido apos introspect:
  - `placa` -> `placa`
  - campo RNTRC -> `rNTRC`
  - campo tipo veiculo -> `tipoVeiculoId` (pode requerer resolucao via `GET /tipos/1`)
  - campo tipo carroceria -> `tipoCarroceriaId` (pode requerer resolucao via `GET /tipos/2`)

### Fretefy API

Autenticacao: header `Authorization: ApiKey {FRETEFY_API_KEY}`

**Motorista**
- `GET /motorista/{documento}` — busca motorista por CPF
  - Response: `{ id, nome, documento, numeroCNH, celular, visibilidade, dataNascimento }`
- `POST /motorista` — cria motorista (retorna existente se ja cadastrado)
  - Request: `{ nome, documento, numeroCNH, celular }`
  - Response: `{ id, nome, documento, ... }`

**Veiculo**
- `GET /veiculo/{placa}` — busca veiculo por placa
  - Response: `{ id, placa, rNTRC, tipoVeiculoId, tipoCarroceriaId, frota, propriedade }`
- `POST /veiculo` — cria veiculo (retorna existente se ja cadastrado)
  - Request: `{ placa, rNTRC, tipoVeiculoId, tipoCarroceriaId }`
  - Response: `{ id, placa, ... }`

**Tracking**
- `GET /tracking?id={id}&numero={num}&pedido={pedNum}&...` — consulta tracking
  - Response: `[{ situacao, dhColeta, dhEntrega, eventos: [...] }]`
- `GET /carga/{id}` — detalhe de carga
  - Response: `{ id, situacao, eventos, motorista, veiculo }`
- `GET /carga?situacao={num}&dhReferenciaInicio={date}&dhReferenciaFim={date}` — lista cargas
  - Response: `[{ id, situacao, ... }]`

**Tipos**
- `GET /tipos/{tipo}` — lista tipos (veiculos=1, carrocerias=2, etc.)
  - Response: `[{ id, descricao, tipo }]`

**Notas sobre a API**
- Fretefy API nao documenta paginacao nos endpoints de listagem — tratar como retorno completo
- URL base ja inclui `/api` (ex: `https://...azurewebsites.net/api`), endpoints sao concatenados diretamente (ex: `{base}/motorista/{doc}`)

### Auth Endpoint (ERP existente)

- `POST {AUTH_API_URL}:{AUTH_API_PORT}/api/token`
- Content-Type: `application/x-www-form-urlencoded`
- Body: `grant_type=password&username={email}&password={senha}`
- Sucesso (200): `{ access_token, token_type, expires_in, username, ... }`
- Falha (400/401): resposta de erro
- O campo `username` retornado na resposta eh usado como identificador do usuario no JWT

### Webhook Fretefy

- `POST /api/webhooks/fretefy`
- Autenticacao simples: header `X-Webhook-Secret: {WEBHOOK_SECRET}` (secret compartilhado)
- Tipos de evento: `carga.formada`, `carga.desativada`, `carga.alocada`, `carga.evento`, `carga.finalizada`, `fatura.liberada`
- Payload esperado: `{ id, timestamp, type, data: { ... } }`
- Acao na Fase 1: log estruturado do evento (sem side-effects adicionais)
- Webhooks duplicados (retry da Fretefy): aceitos sem deduplicacao na Fase 1 (apenas log)

## Funcionalidades

### 1. Tracking de Cargas

- Consulta de cargas via API Fretefy (`GET /carga`, `GET /tracking`)
- tRPC router `tracking`:
  - `list(input: { situacao?, dhInicio?, dhFim? })` — lista cargas com filtros opcionais
  - `getById(input: { id: string })` — detalhe de uma carga
- Dados vem diretamente da API Fretefy (sem cache local)

### 2. Gestao de Motoristas

- Leitura de motoristas do ERP (tabela `MDFeMotoristas`, read-only)
- Consulta/criacao na API Fretefy
- tRPC router `motorista`:
  - `list()` — lista motoristas do ERP
  - `getByDocumento(input: { documento: string })` — busca motorista na Fretefy por CPF
  - `syncAll()` — sincroniza todos motoristas ERP -> Fretefy (usado pelo cron)

### 3. Gestao de Veiculos

- Leitura de veiculos do ERP (tabela `MDFeVeiculos`, read-only)
- Consulta/criacao na API Fretefy
- tRPC router `veiculo`:
  - `list()` — lista veiculos do ERP
  - `getByPlaca(input: { placa: string })` — busca veiculo na Fretefy por placa
  - `syncAll()` — sincroniza todos veiculos ERP -> Fretefy (usado pelo cron)

### 4. Webhooks Fretefy

- `POST /api/webhooks/fretefy` recebe eventos
- Valida header `X-Webhook-Secret` contra `WEBHOOK_SECRET` env var
- Log estruturado do evento recebido (tipo, timestamp, dados)
- Retorna 200 OK se valido, 401 se secret invalido
- Fase 1: somente logging, sem side-effects

### 5. Sync ERP -> Fretefy (via Dkron)

- App registra jobs no Dkron ao iniciar (PUT upsert via API REST Dkron — idempotente)
- Se Dkron nao estiver disponivel no startup, log warning e continua (sem bloquear o app)
- Dkron chama `POST /api/cron/sync-motoristas` e `POST /api/cron/sync-veiculos`
- Logica de sync:
  1. Le todos os registros da tabela ERP
  2. Para cada registro, chama `POST /motorista` ou `POST /veiculo` na Fretefy **sequencialmente** (evita sobrecarregar a API, volume esperado eh baixo)
  3. Se falhar para um registro, loga o erro e continua com o proximo (skip-and-continue)
  4. Retorna resumo: `{ total, synced, errors }`
- Endpoints protegidos por header `X-Cron-Secret: {CRON_SECRET}`
- Callback URL derivada de `APP_BASE_URL` env var
- Schedules configuraveis via env var
- Dkron job payload:
  ```json
  {
    "name": "sync-motoristas",
    "schedule": "{SYNC_MOTORISTAS_CRON}",
    "executor": "http",
    "executor_config": {
      "method": "POST",
      "url": "{APP_BASE_URL}/api/cron/sync-motoristas",
      "headers": "{\"X-Cron-Secret\": \"{CRON_SECRET}\"}"
    }
  }
  ```

### 6. Autenticacao

- NextAuth v5 com CredentialsProvider
- Faz POST para `{AUTH_API_URL}:{AUTH_API_PORT}/api/token` com `grant_type=password`
- JWT contem: `username` (retornado pela API), `accessToken` (token da API ERP)
- Sessao via JWT (cookie httpOnly)
- Middleware protege todas as rotas exceto:
  - `/login`
  - `/api/webhooks/*`
  - `/api/cron/*`
  - `/api/health`

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx            (form minimo)
│   ├── (dashboard)/
│   │   ├── layout.tsx                (layout com sidebar placeholder)
│   │   ├── motoristas/page.tsx       (placeholder)
│   │   └── veiculos/page.tsx         (placeholder)
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── health/route.ts              (health check)
│   │   ├── webhooks/fretefy/route.ts
│   │   └── cron/
│   │       ├── sync-motoristas/route.ts
│   │       └── sync-veiculos/route.ts
│   └── layout.tsx
├── server/
│   ├── api/
│   │   ├── root.ts                   (tRPC app router merge)
│   │   ├── trpc.ts                   (tRPC init, context, middleware)
│   │   └── routers/
│   │       ├── tracking.ts
│   │       ├── motorista.ts
│   │       └── veiculo.ts
│   ├── db/
│   │   ├── index.ts                  (Drizzle client ERP - mssql)
│   │   └── schema/
│   │       ├── motorista.ts          (tabela MDFeMotoristas)
│   │       └── veiculo.ts            (tabela MDFeVeiculos)
│   ├── services/
│   │   ├── fretefy-client.ts         (HTTP client tipado para API Fretefy)
│   │   ├── sync-motoristas.ts
│   │   ├── sync-veiculos.ts
│   │   └── dkron.ts                  (registro de jobs no Dkron)
│   └── auth.ts                       (NextAuth config)
├── lib/
│   ├── env.ts                        (validacao de env vars com zod)
│   └── utils.ts
├── components/
│   └── ui/                           (shadcn - preparado)
├── .env.dev
├── .env.prd
├── docker-compose.yml                (app + dkron)
├── Dockerfile
└── drizzle.config.ts
```

## Variaveis de Ambiente

```env
# App
NODE_ENV=development|production
APP_BASE_URL=http://localhost:3000
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Auth endpoint externo (ERP)
AUTH_API_URL=
AUTH_API_PORT=

# ERP Database (SQL Server - read only)
ERP_DB_HOST=
ERP_DB_PORT=1433
ERP_DB_USER=
ERP_DB_PASSWORD=
ERP_DB_NAME=

# Fretefy API
FRETEFY_API_URL=https://api-fretefy-staging.azurewebsites.net/api
FRETEFY_API_KEY=

# Webhooks
WEBHOOK_SECRET=

# Dkron
DKRON_URL=http://dkron:8080
CRON_SECRET=

# Sync schedules (cron expressions)
SYNC_MOTORISTAS_CRON=0 */6 * * *
SYNC_VEICULOS_CRON=0 */6 * * *
```

## Docker Compose

```yaml
services:
  app:
    build: .
    restart: always
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - dkron
    networks:
      - fretefy-network

  dkron:
    image: dkron/dkron:light
    restart: always
    environment:
      - TZ=America/Sao_Paulo
    command: agent --server --bootstrap-expect=1
    volumes:
      - ./dkron_data:/var/lib/dkron
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:8080/v1/ 2>/dev/null || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - fretefy-network

networks:
  fretefy-network:
    driver: bridge
```

## Observabilidade (Fase 1)

- **Logging estruturado** via `console.log`/`console.error` com contexto (JSON)
- Logs em: webhooks recebidos, sync results (total/synced/errors), auth failures, Fretefy API errors
- **Health check**: `GET /api/health` retorna `{ status: "ok", timestamp }` (usado pelo Docker healthcheck)
- Sem alerting/monitoring externo nesta fase

## Tratamento de Erros

- **Sync**: skip-and-continue por registro, retorna resumo com contagem de erros
- **Fretefy API indisponivel**: tRPC retorna erro ao client, cron retorna 500 com detalhes
- **ERP indisponivel**: Drizzle lanca erro, capturado no tRPC error handler
- **Dkron indisponivel no startup**: log warning, app inicia normalmente (jobs podem ser registrados manualmente depois)

## Decisoes Tecnicas

- **Sem banco proprio** — sessoes via JWT, dados de motoristas/veiculos vem do ERP e Fretefy API
- **ERP somente leitura** — Drizzle conecta ao SQL Server do ERP apenas para SELECT
- **Fretefy API como fonte de verdade para tracking** — sem cache local
- **ERP como fonte de verdade para motoristas/veiculos** — sync unidirecional ERP -> Fretefy
- **Sync idempotente** — API Fretefy retorna registro existente se ja cadastrado
- **Dkron jobs via upsert** — registro idempotente, sem duplicatas em restarts
- **Dkron callback via APP_BASE_URL** — URL da app configurada por env var
- **Endpoints de cron protegidos por secret** — header X-Cron-Secret
- **Deploy via Docker** — Dockerfile multi-stage para build otimizado
- **UI minima nesta fase** — apenas placeholders para validar rotas e integracao

## Fora de Escopo (Fase 1)

- Design visual / UI final
- Gestao de pedidos
- Calculo de frete
- Dashboard elaborado
- Tela de gerenciamento de jobs Dkron
- Polling de eventos (usando webhooks)
- Alerting / monitoring externo