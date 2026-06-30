# Fretefy · Plenobras

Plataforma de integração entre o **ERP da Plenobras** e a **API do Fretefy**, responsável por
sincronizar motoristas, veículos, cargas e rastreamento de fretes, receber webhooks de eventos,
baixar/armazenar anexos e expor um painel administrativo para acompanhamento.

Construída sobre **Next.js 16 (App Router) + React 19**, com **tRPC 11**, **Drizzle ORM** sobre
**SQL Server**, **Redis** para cache, **Dkron** para agendamento de jobs e **NextAuth v5** para
autenticação contra o ERP.

---

## Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Como rodar (desenvolvimento)](#como-rodar-desenvolvimento)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Next.js](#nextjs)
- [Instrumentation (bootstrap do servidor)](#instrumentation-bootstrap-do-servidor)
- [tRPC](#trpc)
- [Drizzle ORM (SQL Server)](#drizzle-orm-sql-server)
- [API Fretefy](#api-fretefy)
- [Redis (cache)](#redis-cache)
- [Dkron (agendamento de jobs)](#dkron-agendamento-de-jobs)
- [Docker](#docker)
- [Endpoints HTTP](#endpoints-http)
- [Logging](#logging)
- [Convenções do projeto](#convenções-do-projeto)

---

## Stack

| Camada            | Tecnologia                                                            |
| ----------------- | --------------------------------------------------------------------- |
| Framework         | Next.js 16 (App Router, `output: standalone`) · React 19              |
| Linguagem         | TypeScript 5                                                          |
| API tipada        | tRPC 11 + TanStack React Query 5 + SuperJSON                          |
| Banco de dados    | SQL Server (ERP) via Drizzle ORM 1.0 (`node-mssql` / `tedious`)       |
| Autenticação      | NextAuth v5 (Credentials → API de token do ERP)                       |
| Cache             | Redis 7 (`ioredis`)                                                   |
| Agendamento       | Dkron (executor HTTP)                                                 |
| Armazenamento     | AWS S3 (`@aws-sdk/client-s3`)                                         |
| Validação         | Zod 4                                                                 |
| Logging           | Pino (rotação diária em arquivo, `pino-roll`)                         |
| UI                | shadcn/ui · Base UI · Tailwind CSS 4 · lucide-react · sonner          |
| Gerenciador       | Yarn (lockfile `yarn.lock`) · Node 22                                 |

---

## Arquitetura

```
src/
├── app/                     # App Router (rotas, layouts, API routes)
│   ├── (auth)/login/        # Tela de login
│   ├── (dashboard)/         # Painel: cargo, drivers, vehicles
│   └── api/                 # Route handlers (auth, trpc, cron, webhooks, health…)
├── components/              # Componentes React (Pb*, ui/, layout/, shared/)
├── lib/                     # Infra: env, logger, redis, fretefy http, s3, trpc client
├── server/
│   ├── api/                 # tRPC: trpc.ts, root.ts, routers/
│   ├── auth.ts              # NextAuth v5
│   ├── db/                  # Drizzle: index.ts (pool) + schema/
│   ├── repositories/        # Acesso a dados (Drizzle + Fretefy)
│   └── services/            # Regras de negócio (sync, cache, dkron, webhook…)
├── types/                   # Tipos/Zod schemas de domínio
├── utils/                   # Utilidades (data, string)
├── instrumentation.ts       # Hook de bootstrap (Node runtime)
└── proxy.ts                 # Middleware/proxy
```

Fluxo geral: o **ERP (SQL Server)** é lido via repositórios Drizzle; a **API Fretefy** é consumida
via cliente HTTP tipado; **jobs do Dkron** disparam endpoints de sincronização periodicamente;
**webhooks do Fretefy** alimentam eventos/anexos; o **Redis** faz cache de tipos e anexos; e o
**painel** consome tudo via tRPC.

---

## Como rodar (desenvolvimento)

Pré-requisitos: **Node 22**, **Yarn**, e acesso aos serviços de apoio (Redis e Dkron — via Docker).

```bash
# 1. Instalar dependências
yarn install

# 2. Configurar ambiente
cp .env.example .env.local   # preencha os valores

# 3. Subir serviços de apoio (Redis + Dkron)
docker compose -f docker/docker-compose.dev.yml up -d

# 4. Rodar a aplicação
yarn dev                     # http://localhost:3000
```

Scripts disponíveis (`package.json`):

| Script        | Descrição                          |
| ------------- | ---------------------------------- |
| `yarn dev`    | Servidor de desenvolvimento        |
| `yarn build`  | Build de produção (`standalone`)   |
| `yarn start`  | Sobe o build de produção           |
| `yarn lint`   | ESLint                             |

> No `build`, a validação de env é ignorada (`NEXT_PHASE=phase-production-build`), pois os segredos
> de runtime não estão presentes em tempo de compilação. Use `SKIP_ENV_VALIDATION=true` para pular
> manualmente.

---

## Variáveis de ambiente

Validadas por Zod em `src/lib/PbEnvLib.ts`. A aplicação **falha ao iniciar** (em runtime) se algo
obrigatório estiver ausente.

| Variável                                                              | Obrigatória | Descrição                                            |
| -------------------------------------------------------------------- | ----------- | ---------------------------------------------------- |
| `NODE_ENV`                                                            | não         | `development` (default), `production` ou `test`      |
| `APP_BASE_URL`                                                        | sim         | URL base usada pelo Dkron para chamar os endpoints   |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL`                                    | sim         | NextAuth v5                                          |
| `AUTH_API_URL` / `AUTH_API_PORT`                                      | sim         | API de token do ERP (login por credenciais)          |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`         | sim         | SQL Server do ERP (`DB_PORT` default `1433`)         |
| `FRETEFY_API_URL` / `FRETEFY_API_KEY`                                 | sim         | API Fretefy                                          |
| `PLENOBRAS_UNIDADE_NEGOCIO_ID` (GUID), `PLENOBRAS_DOCUMENTO`, …       | sim         | Dados da empresa (razão social, endereço, UF…)       |
| `WEBHOOK_SECRET`                                                      | sim         | Token Bearer esperado nos webhooks do Fretefy        |
| `DKRON_URL` / `CRON_SECRET`                                           | não         | Registro/segurança dos jobs (Dkron opcional)         |
| `SYNC_CRON` / `SYNC_TRACKS_CRON` / `CACHE_FRETEFY_TYPES_CRON`         | não         | Agendas (defaults definidos no schema)               |
| `AWS_REGION` / `S3_BUCKET_NAME` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | sim | Armazenamento de anexos em S3                 |
| `REDIS_HOST` / `REDIS_PORT`                                           | sim         | Redis (`REDIS_PORT` default `6379`)                  |

> ⚠️ O `.env.example` está parcialmente defasado (usa prefixos `ERP_DB_*` e nomes de cron antigos).
> Use sempre os nomes validados em `PbEnvLib.ts` como fonte de verdade (`DB_*`, `SYNC_CRON`, etc.).

---

## Next.js

`next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "standalone",                 // gera bundle self-contained para Docker
  serverExternalPackages: ["pino"],     // mantém o pino fora do bundling do servidor
}
```

- **App Router** com grupos de rota `(auth)` e `(dashboard)`.
- `output: "standalone"` produz `.next/standalone/server.js`, copiado para a imagem de produção.
- API Routes em `src/app/api/**/route.ts` (handlers HTTP nativos).

---

## Instrumentation (bootstrap do servidor)

`src/instrumentation.ts` roda **uma vez no boot do servidor** (somente `NEXT_RUNTIME === "nodejs"`):

1. Faz o **cache inicial dos tipos do Fretefy** (`getFretefyTypes`).
2. **Registra os jobs no Dkron** (`registerDkronJobs`).
3. Registra handlers de `SIGINT`/`SIGTERM` para **fechar o pool de conexões** do banco com graça.

Falhas no cache/Dkron são apenas logadas (warn) — a aplicação continua subindo.

---

## tRPC

Setup em `src/server/api/`:

- `trpc.ts` — cria o contexto (injeta a sessão NextAuth), o `transformer: superjson`,
  `publicProcedure` e `protectedProcedure` (exige `session.user`, senão `UNAUTHORIZED`).
- `root.ts` — `appRouter` agrega os routers:

| Router          | Domínio                              |
| --------------- | ------------------------------------ |
| `tracking`      | Rastreamento de fretes / embarques   |
| `driver`        | Motoristas                           |
| `vehicle`       | Veículos                             |
| `deliveryOrder` | Ordens de entrega                    |
| `cargo`         | Cargas                               |

- Handler HTTP: `src/app/api/trpc/[trpc]/route.ts`.
- Cliente: `src/lib/PbTrpcClient.ts` + provider `src/components/providers/PbTrpcProvider.tsx`.
- Inputs validados com **Zod 4**; procedures protegidas por padrão.

---

## Drizzle ORM (SQL Server)

`src/server/db/index.ts`:

- Usa `drizzle-orm/node-mssql` sobre o driver `mssql`/`tedious`.
- **Pool lazy e singleton**: a conexão só é aberta na primeira chamada `getDb()`
  (`encrypt: true`, `trustServerCertificate: true`, pool `max: 10`).
- `closePool()` é chamado nos sinais de término (ver instrumentation).
- O schema agrega todas as tabelas de `src/server/db/schema/` (customer, driver, order, invoice,
  vehicle, municipality, e o conjunto MDF-e, além das tabelas `fretefy-event*`).

`drizzle.config.ts` aponta para `./src/server/db/schema` com `dialect: "mssql"`.

> O banco é o **ERP** (em grande parte leitura). Colunas em português são mapeadas para nomes em
> inglês nos schemas Drizzle (ver convenções).

---

## API Fretefy

Cliente HTTP tipado em `src/lib/PbFretefyLib.ts` (`fretefyHttp`):

- Autenticação via header `Authorization: ApiKey <FRETEFY_API_KEY>`.
- Métodos: `get`, `post`, `delete` e `downloadAttachment(storagePath)`.
- `downloadAttachment` baixa anexos (buffer + `content-type` + nome do arquivo extraído do
  `Content-Disposition`, com suporte a `filename*=UTF-8''`).
- Erros não-OK são logados e propagados como `Error`.

Serviços relacionados: `PbFretefyTypesService` (tipos de veículo/carga, cacheados no Redis),
`PbWebhookService` (processa eventos), repositórios `PbFretefy*Repository`.

Documentação de apoio da API em `docs/` (`fretefy-api-ofertacarga.md`, exemplos Postman, schemas de
webhook e tipos).

---

## Redis (cache)

- Cliente singleton em `src/lib/PbRedisClient.ts` (`ioredis`, `host`/`port` do env).
- `closeRedis()` para encerramento gracioso.
- `PbCacheService` (`src/server/services/PbCacheService`) oferece:
  - `get/set` em **Buffer**, `getJson/setJson`, `del`, e `withCache(key, ttl, fn)` (padrão
    cache-aside com fallback silencioso em erro de cache).
- Usos típicos: cache de **tipos do Fretefy** e de **anexos** baixados.
- Container `redis:7-alpine` com `maxmemory 256mb` e política `allkeys-lru`.

---

## Dkron (agendamento de jobs)

`src/server/services/PbDkronService/index.ts` registra os jobs no Dkron **no boot** (via
instrumentation), usando o executor `http` com timezone `America/Sao_Paulo` e `retries: 2`.

Jobs registrados (só se `DKRON_URL` estiver definida):

| Job                   | Schedule (env)             | Endpoint disparado            |
| --------------------- | -------------------------- | ----------------------------- |
| `sync-erp-fretefy`    | `SYNC_CRON`                | `POST /api/cron/sync`         |
| `sync-fretefy-tracks` | `SYNC_TRACKS_CRON`         | `POST /api/sync-fretefy-tracks` |
| `cache-fretefy-types` | `CACHE_FRETEFY_TYPES_CRON` | `POST /api/cache-fretefy-types` |

Cada chamada inclui `?secret=<CRON_SECRET>` para validação no endpoint. O Dkron acessa a aplicação
via `APP_BASE_URL`. UI do Dkron exposta em `http://localhost:9090` (dev).

---

## Docker

Arquivos em `docker/`:

- **`Dockerfile`** — multi-stage (`deps` → `builder` → `runner`) sobre `node:22-alpine`. Build com
  `yarn build`, runtime a partir do `.next/standalone` rodando como usuário não-root `nextjs`,
  expõe a porta `3000`, com volume em `/app/logs`.
- **`docker-compose.dev.yml`** — sobe **Dkron** (UI em `9090`) e **Redis** (`6379`) para
  desenvolvimento local.
- **`docker-compose.prd.yml`** — sobe a **aplicação** (`3005:3000`, `env_file: ../.env.prd`),
  **Redis** e **Dkron** na rede `fretefy-network`, com healthchecks e `depends_on`.

```bash
# Desenvolvimento — apenas serviços de apoio
docker compose -f docker/docker-compose.dev.yml up -d

# Produção — aplicação + Redis + Dkron
docker compose -f docker/docker-compose.prd.yml up -d --build
```

---

## Endpoints HTTP

| Método | Rota                          | Descrição                                          |
| ------ | ----------------------------- | -------------------------------------------------- |
| `*`    | `/api/auth/[...nextauth]`     | NextAuth v5                                        |
| `*`    | `/api/trpc/[trpc]`            | Gateway tRPC                                       |
| `GET`  | `/api/health`                 | Health check (banco + Fretefy) — `200`/`503`       |
| `POST` | `/api/cron/sync`              | Sincronização ERP → Fretefy (Dkron)                |
| `POST` | `/api/sync-fretefy-tracks`    | Sincroniza rastreamento (Dkron)                    |
| `POST` | `/api/cache-fretefy-types`    | Recacheia tipos do Fretefy (Dkron)                 |
| `POST` | `/api/webhooks/fretefy`       | Recebe eventos do Fretefy (Bearer `WEBHOOK_SECRET`)|
| `GET`  | `/api/download-file`          | Download de anexo                                  |

---

## Logging

`src/lib/PbLoggerLib.ts` — Pino com:

- **Rotação diária** de arquivo em `logs/app.YYYY-MM-DD.log` e **retenção de 30 dias** (limpeza
  automática).
- `createLogger(context)` retorna um child logger com o campo `context`.
- Nível `info` em produção, `debug` em desenvolvimento. No Edge/build, loga só no stdout.
- `pino` é mantido fora do bundling (`serverExternalPackages`). Mensagens de log em **pt-BR**.

---

## Convenções do projeto

- **Código em inglês**, **UI / mensagens / logs em pt-BR** (incluindo acentuação correta).
- Arquivos de domínio prefixados com **`Pb`** (`PbFretefyLib`, `PbCargoRouter`, `PbCacheService`…).
- Componentes shadcn/ui interativos usam `cursor-pointer`.
- Validação com **Zod 4**; logging com **Pino**.
- Colunas do banco em português são **mapeadas para nomes em inglês** nos schemas Drizzle.

Para detalhes completos de padrões, consulte o skill **`project-standards`**.
