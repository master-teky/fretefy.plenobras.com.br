# Fretefy Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend infrastructure for Fretefy-ERP integration — tRPC routers, Fretefy REST client, Drizzle ERP connection, NextAuth, webhooks, cron sync via Dkron.

**Architecture:** Next.js 16 App Router with tRPC 11 for client-server communication, Drizzle ORM reading from ERP SQL Server (read-only), a typed REST client for Fretefy API, webhook receiver, and Dkron-triggered cron endpoints for ERP->Fretefy sync.

**Tech Stack:** Next.js 16, TypeScript, Node 22, tRPC 11, Drizzle (mssql/tedious), NextAuth v5, Tailwind CSS, shadcn/ui, Docker, Dkron

**Spec:** `docs/superpowers/specs/2026-03-18-fretefy-backend-design.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                         # Root layout (providers)
│   ├── (auth)/
│   │   └── login/page.tsx                 # Minimal login form
│   ├── (dashboard)/
│   │   ├── layout.tsx                     # Dashboard layout (sidebar placeholder)
│   │   ├── motoristas/page.tsx            # Placeholder page
│   │   └── veiculos/page.tsx              # Placeholder page
│   └── api/
│       ├── auth/[...nextauth]/route.ts    # NextAuth API route
│       ├── trpc/[trpc]/route.ts           # tRPC HTTP handler
│       ├── health/route.ts                # Health check endpoint
│       ├── webhooks/fretefy/route.ts      # Fretefy webhook receiver
│       └── cron/
│           ├── sync-motoristas/route.ts   # Cron endpoint for motorista sync
│           └── sync-veiculos/route.ts     # Cron endpoint for veiculo sync
├── server/
│   ├── auth.ts                            # NextAuth v5 configuration
│   ├── api/
│   │   ├── trpc.ts                        # tRPC init, context, middleware
│   │   ├── root.ts                        # tRPC router merge
│   │   └── routers/
│   │       ├── tracking.ts                # Tracking procedures
│   │       ├── motorista.ts               # Motorista procedures
│   │       └── veiculo.ts                 # Veiculo procedures
│   ├── db/
│   │   ├── index.ts                       # Drizzle client (mssql)
│   │   └── schema/
│   │       ├── motorista.ts               # MDFeMotoristas table schema
│   │       └── veiculo.ts                 # MDFeVeiculos table schema
│   └── services/
│       ├── fretefy-client.ts              # Typed HTTP client for Fretefy API
│       ├── sync-motoristas.ts             # Sync logic motoristas ERP->Fretefy
│       ├── sync-veiculos.ts               # Sync logic veiculos ERP->Fretefy
│       └── dkron.ts                       # Dkron job registration
├── lib/
│   ├── env.ts                             # Env var validation (zod)
│   └── utils.ts                           # cn() helper for shadcn
├── components/
│   └── ui/                                # shadcn components (auto-generated)
├── middleware.ts                           # NextAuth route protection
├── instrumentation.ts                     # Dkron job registration on startup
.env.dev                                   # DEV environment variables
.env.prd                                   # PRD environment variables
docker-compose.yml                         # App + Dkron
Dockerfile                                 # Multi-stage build
drizzle.config.ts                          # Drizzle config for mssql
```

---

### Task 1: Project Scaffolding (Next.js 16 + TypeScript + Tailwind + shadcn)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/lib/utils.ts`, `components.json`, `.gitignore`, `.env.dev`, `.env.prd`

- [ ] **Step 1: Initialize Next.js 16 project**

```bash
cd /Users/giulianocosta/DEV/Projetos/Plenobras/Projetos/Fretefy/Codigo/fretefy.plenobras.com.br
rm package.json
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

- [ ] **Step 3: Verify the app starts**

```bash
npm run dev
```

Expected: App running on http://localhost:3000

- [ ] **Step 4: Create environment files**

Create `.env.dev`:
```env
# App
NODE_ENV=development
APP_BASE_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-me
NEXTAUTH_URL=http://localhost:3000

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
WEBHOOK_SECRET=dev-webhook-secret

# Dkron
DKRON_URL=http://localhost:8080
CRON_SECRET=dev-cron-secret

# Sync schedules (cron expressions)
SYNC_MOTORISTAS_CRON=0 */6 * * *
SYNC_VEICULOS_CRON=0 */6 * * *
```

Create `.env.prd` (same structure, empty values):
```env
NODE_ENV=production
APP_BASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
AUTH_API_URL=
AUTH_API_PORT=
ERP_DB_HOST=
ERP_DB_PORT=1433
ERP_DB_USER=
ERP_DB_PASSWORD=
ERP_DB_NAME=
FRETEFY_API_URL=
FRETEFY_API_KEY=
WEBHOOK_SECRET=
DKRON_URL=
CRON_SECRET=
SYNC_MOTORISTAS_CRON=0 */6 * * *
SYNC_VEICULOS_CRON=0 */6 * * *
```

- [ ] **Step 5: Add .env files to .gitignore**

Append to `.gitignore`:
```
.env.dev
.env.prd
```

- [ ] **Step 6: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 16 project with TypeScript, Tailwind, shadcn"
```

---

### Task 2: Environment Validation with Zod

**Files:**
- Create: `src/lib/env.ts`
- Dependencies: `zod`

- [ ] **Step 1: Install zod**

```bash
npm install zod
```

- [ ] **Step 2: Create env validation**

Create `src/lib/env.ts`:
```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_BASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),

  // Auth
  AUTH_API_URL: z.string().min(1),
  AUTH_API_PORT: z.string().min(1),

  // ERP Database
  ERP_DB_HOST: z.string().min(1),
  ERP_DB_PORT: z.string().default("1433"),
  ERP_DB_USER: z.string().min(1),
  ERP_DB_PASSWORD: z.string().min(1),
  ERP_DB_NAME: z.string().min(1),

  // Fretefy API
  FRETEFY_API_URL: z.string().url(),
  FRETEFY_API_KEY: z.string().min(1),

  // Webhooks
  WEBHOOK_SECRET: z.string().min(1),

  // Dkron
  DKRON_URL: z.string().url(),
  CRON_SECRET: z.string().min(1),

  // Sync schedules
  SYNC_MOTORISTAS_CRON: z.string().default("0 */6 * * *"),
  SYNC_VEICULOS_CRON: z.string().default("0 */6 * * *"),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/env.ts package.json package-lock.json
git commit -m "feat: add environment variable validation with zod"
```

---

### Task 3: Drizzle ORM Setup (SQL Server / ERP)

**Files:**
- Create: `src/server/db/index.ts`, `src/server/db/schema/motorista.ts`, `src/server/db/schema/veiculo.ts`, `drizzle.config.ts`
- Dependencies: `drizzle-orm`, `drizzle-kit`, `tedious`

- [ ] **Step 1: Install dependencies**

```bash
npm install drizzle-orm tedious
npm install -D drizzle-kit
```

- [ ] **Step 2: Create Drizzle config**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mssql",
  schema: "./src/server/db/schema",
  dbCredentials: {
    server: process.env.ERP_DB_HOST!,
    port: Number(process.env.ERP_DB_PORT || "1433"),
    user: process.env.ERP_DB_USER!,
    password: process.env.ERP_DB_PASSWORD!,
    database: process.env.ERP_DB_NAME!,
    options: {
      trustServerCertificate: true,
    },
  },
});
```

- [ ] **Step 3: Create placeholder schemas**

Create `src/server/db/schema/motorista.ts`:
```typescript
import { mssqlTable, varchar, int } from "drizzle-orm/mssql-core";

// TODO: Replace with actual columns after running `npx drizzle-kit introspect`
// against the ERP database. These are placeholder columns based on expected fields.
export const mdfeMotoristas = mssqlTable("MDFeMotoristas", {
  id: int("Id").primaryKey(),
  nome: varchar("Nome", { length: 255 }).notNull(),
  documento: varchar("Documento", { length: 14 }).notNull(),
  numeroCNH: varchar("NumeroCNH", { length: 20 }),
  celular: varchar("Celular", { length: 20 }),
});

export type MdfeMotorista = typeof mdfeMotoristas.$inferSelect;
```

Create `src/server/db/schema/veiculo.ts`:
```typescript
import { mssqlTable, varchar, int } from "drizzle-orm/mssql-core";

// TODO: Replace with actual columns after running `npx drizzle-kit introspect`
// against the ERP database. These are placeholder columns based on expected fields.
export const mdfeVeiculos = mssqlTable("MDFeVeiculos", {
  id: int("Id").primaryKey(),
  placa: varchar("Placa", { length: 10 }).notNull(),
  rntrc: varchar("RNTRC", { length: 20 }),
  tipoVeiculo: varchar("TipoVeiculo", { length: 50 }),
  tipoCarroceria: varchar("TipoCarroceria", { length: 50 }),
});

export type MdfeVeiculo = typeof mdfeVeiculos.$inferSelect;
```

- [ ] **Step 4: Create Drizzle client**

Create `src/server/db/index.ts`:
```typescript
import { drizzle } from "drizzle-orm/mssql.js";
import * as motorista from "./schema/motorista";
import * as veiculo from "./schema/veiculo";
import { env } from "@/lib/env";

export const db = drizzle({
  connection: {
    server: env.ERP_DB_HOST,
    port: Number(env.ERP_DB_PORT),
    user: env.ERP_DB_USER,
    password: env.ERP_DB_PASSWORD,
    database: env.ERP_DB_NAME,
    options: {
      trustServerCertificate: true,
    },
  },
  schema: { ...motorista, ...veiculo },
});
```

> **Note:** The exact Drizzle MSSQL driver API may vary. Verify against the latest `drizzle-orm` docs for the MSSQL dialect. The connection config follows the `tedious` ConnectionConfig interface.

- [ ] **Step 5: Commit**

```bash
git add drizzle.config.ts src/server/db/
git commit -m "feat: add Drizzle ORM setup with ERP SQL Server schemas (placeholder)"
```

---

### Task 4: Fretefy REST Client

**Files:**
- Create: `src/server/services/fretefy-client.ts`

- [ ] **Step 1: Create typed Fretefy API client**

Create `src/server/services/fretefy-client.ts`:
```typescript
import { env } from "@/lib/env";

// --- Types ---

export interface FretefyMotorista {
  id: string;
  nome: string;
  documento: string;
  numeroCNH: string;
  celular: string;
  visibilidade?: string;
  dataNascimento?: string;
}

export interface FretefyMotoristaInput {
  nome: string;
  documento: string;
  numeroCNH: string;
  celular: string;
}

export interface FretefyVeiculo {
  id: string;
  placa: string;
  rNTRC: string;
  tipoVeiculoId: string;
  tipoCarroceriaId: string;
  frota?: string;
  propriedade?: string;
}

export interface FretefyVeiculoInput {
  placa: string;
  rNTRC: string;
  tipoVeiculoId: string;
  tipoCarroceriaId: string;
}

export interface FretefyCarga {
  id: string;
  situacao: number;
  eventos: FretefyCargaEvento[];
  motorista?: FretefyMotorista;
  veiculo?: FretefyVeiculo;
}

export interface FretefyCargaEvento {
  tipo: string;
  dhEvento: string;
  descricao: string;
  localidade?: string;
}

export interface FretefyTrackingItem {
  situacao: number;
  dhColeta?: string;
  dhEntrega?: string;
  eventos: FretefyCargaEvento[];
}

export interface FretefyTipo {
  id: string;
  descricao: string;
  tipo: number;
}

// --- Client ---

class FretefyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.FRETEFY_API_URL;
    this.apiKey = env.FRETEFY_API_KEY;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `ApiKey ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Fretefy API error ${response.status}: ${body}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  // Motorista
  async getMotorista(documento: string): Promise<FretefyMotorista> {
    return this.request<FretefyMotorista>(`/motorista/${documento}`);
  }

  async createMotorista(data: FretefyMotoristaInput): Promise<FretefyMotorista> {
    return this.request<FretefyMotorista>("/motorista", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Veiculo
  async getVeiculo(placa: string): Promise<FretefyVeiculo> {
    return this.request<FretefyVeiculo>(`/veiculo/${placa}`);
  }

  async createVeiculo(data: FretefyVeiculoInput): Promise<FretefyVeiculo> {
    return this.request<FretefyVeiculo>("/veiculo", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Carga / Tracking
  async getCarga(id: string): Promise<FretefyCarga> {
    return this.request<FretefyCarga>(`/carga/${id}`);
  }

  async listCargas(params?: {
    situacao?: number;
    dhReferenciaInicio?: string;
    dhReferenciaFim?: string;
  }): Promise<FretefyCarga[]> {
    const searchParams = new URLSearchParams();
    if (params?.situacao !== undefined) searchParams.set("situacao", String(params.situacao));
    if (params?.dhReferenciaInicio) searchParams.set("dhReferenciaInicio", params.dhReferenciaInicio);
    if (params?.dhReferenciaFim) searchParams.set("dhReferenciaFim", params.dhReferenciaFim);
    const qs = searchParams.toString();
    return this.request<FretefyCarga[]>(`/carga${qs ? `?${qs}` : ""}`);
  }

  async getTracking(params?: {
    id?: string;
    numero?: string;
    pedido?: string;
  }): Promise<FretefyTrackingItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.id) searchParams.set("id", params.id);
    if (params?.numero) searchParams.set("numero", params.numero);
    if (params?.pedido) searchParams.set("pedido", params.pedido);
    const qs = searchParams.toString();
    return this.request<FretefyTrackingItem[]>(`/tracking${qs ? `?${qs}` : ""}`);
  }

  // Tipos
  async getTipos(tipo: number): Promise<FretefyTipo[]> {
    return this.request<FretefyTipo[]>(`/tipos/${tipo}`);
  }
}

export const fretefy = new FretefyClient();
```

- [ ] **Step 2: Commit**

```bash
git add src/server/services/fretefy-client.ts
git commit -m "feat: add typed Fretefy API REST client"
```

---

### Task 5: NextAuth v5 Authentication

**Files:**
- Create: `src/server/auth.ts`, `src/middleware.ts`, `src/app/(auth)/login/page.tsx`
- Dependencies: `next-auth`

- [ ] **Step 1: Install NextAuth v5**

```bash
npm install next-auth@beta
```

- [ ] **Step 2: Create NextAuth config**

Create `src/server/auth.ts`:
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { env } from "@/lib/env";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "ERP Login",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const params = new URLSearchParams();
        params.append("grant_type", "password");
        params.append("username", credentials.username as string);
        params.append("password", credentials.password as string);

        try {
          const response = await fetch(
            `${env.AUTH_API_URL}:${env.AUTH_API_PORT}/api/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params,
            }
          );

          if (!response.ok) return null;

          const data = await response.json();

          return {
            id: data.username,
            name: data.username,
            email: credentials.username as string,
            accessToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken: string }).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      (session as { accessToken: string }).accessToken = token.accessToken as string;
      return session;
    },
  },
});
```

- [ ] **Step 3: Create auth API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from "@/server/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create middleware for route protection**

Create `src/middleware.ts`:
```typescript
import { auth } from "@/server/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    "/login",
    "/api/auth",
    "/api/webhooks",
    "/api/cron",
    "/api/health",
  ];

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: Create minimal login page**

Create `src/app/(auth)/login/page.tsx`:
```tsx
"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciais invalidas");
    } else {
      router.push("/motoristas");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-bold">Fretefy - Login</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          name="username"
          type="text"
          placeholder="Email"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Senha"
          required
          className="w-full rounded border p-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/server/auth.ts src/middleware.ts src/app/api/auth/ src/app/\(auth\)/
git commit -m "feat: add NextAuth v5 with credentials provider and route protection"
```

---

### Task 6: tRPC 11 Setup

**Files:**
- Create: `src/server/api/trpc.ts`, `src/server/api/root.ts`, `src/app/api/trpc/[trpc]/route.ts`
- Dependencies: `@trpc/server`, `@trpc/client`, `@trpc/next`, `superjson`

- [ ] **Step 1: Install tRPC 11 dependencies**

```bash
npm install @trpc/server@next @trpc/client@next @trpc/next@next superjson
```

> Note: tRPC 11 may still be on `@next` tag. Check npm for latest stable.

- [ ] **Step 2: Create tRPC init and context**

Create `src/server/api/trpc.ts`:
```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/server/auth";

export const createTRPCContext = async () => {
  const session = await auth();
  return { session };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { session: ctx.session },
  });
});
```

- [ ] **Step 3: Create root router (empty for now)**

Create `src/server/api/root.ts`:
```typescript
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 4: Create tRPC HTTP handler**

Create `src/app/api/trpc/[trpc]/route.ts`:
```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

- [ ] **Step 5: Commit**

```bash
git add src/server/api/ src/app/api/trpc/
git commit -m "feat: add tRPC 11 setup with auth context and protected procedures"
```

---

### Task 7: tRPC Routers (Tracking, Motorista, Veiculo)

**Files:**
- Create: `src/server/api/routers/tracking.ts`, `src/server/api/routers/motorista.ts`, `src/server/api/routers/veiculo.ts`
- Modify: `src/server/api/root.ts`

- [ ] **Step 1: Create tracking router**

Create `src/server/api/routers/tracking.ts`:
```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";

export const trackingRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        situacao: z.number().optional(),
        dhInicio: z.string().optional(),
        dhFim: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return fretefy.listCargas({
        situacao: input?.situacao,
        dhReferenciaInicio: input?.dhInicio,
        dhReferenciaFim: input?.dhFim,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getCarga(input.id);
    }),
});
```

- [ ] **Step 2: Create motorista router**

Create `src/server/api/routers/motorista.ts`:
```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";
import { db } from "@/server/db";
import { mdfeMotoristas } from "@/server/db/schema/motorista";
import { syncMotoristas } from "@/server/services/sync-motoristas";

export const motoristaRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(mdfeMotoristas);
  }),

  getByDocumento: protectedProcedure
    .input(z.object({ documento: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getMotorista(input.documento);
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncMotoristas();
  }),
});
```

- [ ] **Step 3: Create veiculo router**

Create `src/server/api/routers/veiculo.ts`:
```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { fretefy } from "@/server/services/fretefy-client";
import { db } from "@/server/db";
import { mdfeVeiculos } from "@/server/db/schema/veiculo";
import { syncVeiculos } from "@/server/services/sync-veiculos";

export const veiculoRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(mdfeVeiculos);
  }),

  getByPlaca: protectedProcedure
    .input(z.object({ placa: z.string() }))
    .query(async ({ input }) => {
      return fretefy.getVeiculo(input.placa);
    }),

  syncAll: protectedProcedure.mutation(async () => {
    return syncVeiculos();
  }),
});
```

- [ ] **Step 4: Register routers in root**

Update `src/server/api/root.ts`:
```typescript
import { createTRPCRouter } from "./trpc";
import { trackingRouter } from "./routers/tracking";
import { motoristaRouter } from "./routers/motorista";
import { veiculoRouter } from "./routers/veiculo";

export const appRouter = createTRPCRouter({
  tracking: trackingRouter,
  motorista: motoristaRouter,
  veiculo: veiculoRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 5: Commit**

```bash
git add src/server/api/routers/ src/server/api/root.ts
git commit -m "feat: add tRPC routers for tracking, motorista, and veiculo"
```

---

### Task 8: Health Check Endpoint

**Files:**
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Create health check**

Create `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/health/
git commit -m "feat: add health check endpoint"
```

---

### Task 9: Webhook Endpoint

**Files:**
- Create: `src/app/api/webhooks/fretefy/route.ts`

- [ ] **Step 1: Create webhook handler**

Create `src/app/api/webhooks/fretefy/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

interface FretefyWebhookPayload {
  id: string;
  timestamp: string;
  type: string;
  data: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Webhook-Secret");

  if (secret !== env.WEBHOOK_SECRET) {
    console.error("[webhook] Invalid secret received");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as FretefyWebhookPayload;

    console.log(
      JSON.stringify({
        level: "info",
        context: "webhook",
        eventType: payload.type,
        eventId: payload.id,
        timestamp: payload.timestamp,
        data: payload.data,
      })
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Failed to process payload:", error);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/webhooks/
git commit -m "feat: add Fretefy webhook receiver endpoint"
```

---

### Task 10: Sync Services (ERP -> Fretefy)

**Files:**
- Create: `src/server/services/sync-motoristas.ts`, `src/server/services/sync-veiculos.ts`

- [ ] **Step 1: Create motorista sync service**

Create `src/server/services/sync-motoristas.ts`:
```typescript
import { db } from "@/server/db";
import { mdfeMotoristas } from "@/server/db/schema/motorista";
import { fretefy } from "./fretefy-client";

interface SyncResult {
  total: number;
  synced: number;
  errors: number;
}

export async function syncMotoristas(): Promise<SyncResult> {
  const motoristas = await db.select().from(mdfeMotoristas);
  let synced = 0;
  let errors = 0;

  for (const motorista of motoristas) {
    try {
      await fretefy.createMotorista({
        nome: motorista.nome,
        documento: motorista.documento,
        numeroCNH: motorista.numeroCNH ?? "",
        celular: motorista.celular ?? "",
      });
      synced++;
    } catch (error) {
      errors++;
      console.error(
        JSON.stringify({
          level: "error",
          context: "sync-motoristas",
          documento: motorista.documento,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  const result: SyncResult = { total: motoristas.length, synced, errors };

  console.log(
    JSON.stringify({
      level: "info",
      context: "sync-motoristas",
      ...result,
    })
  );

  return result;
}
```

- [ ] **Step 2: Create veiculo sync service**

Create `src/server/services/sync-veiculos.ts`:
```typescript
import { db } from "@/server/db";
import { mdfeVeiculos } from "@/server/db/schema/veiculo";
import { fretefy } from "./fretefy-client";

interface SyncResult {
  total: number;
  synced: number;
  errors: number;
}

export async function syncVeiculos(): Promise<SyncResult> {
  const veiculos = await db.select().from(mdfeVeiculos);
  let synced = 0;
  let errors = 0;

  for (const veiculo of veiculos) {
    try {
      // TODO: tipoVeiculoId and tipoCarroceriaId may need resolution
      // via GET /tipos/1 and GET /tipos/2 if ERP stores text instead of IDs.
      // Update this mapping after drizzle introspect.
      await fretefy.createVeiculo({
        placa: veiculo.placa,
        rNTRC: veiculo.rntrc ?? "",
        tipoVeiculoId: veiculo.tipoVeiculo ?? "",
        tipoCarroceriaId: veiculo.tipoCarroceria ?? "",
      });
      synced++;
    } catch (error) {
      errors++;
      console.error(
        JSON.stringify({
          level: "error",
          context: "sync-veiculos",
          placa: veiculo.placa,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  const result: SyncResult = { total: veiculos.length, synced, errors };

  console.log(
    JSON.stringify({
      level: "info",
      context: "sync-veiculos",
      ...result,
    })
  );

  return result;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/server/services/sync-motoristas.ts src/server/services/sync-veiculos.ts
git commit -m "feat: add sync services for motoristas and veiculos (ERP -> Fretefy)"
```

---

### Task 11: Cron Endpoints

**Files:**
- Create: `src/app/api/cron/sync-motoristas/route.ts`, `src/app/api/cron/sync-veiculos/route.ts`

- [ ] **Step 1: Create motoristas cron endpoint**

Create `src/app/api/cron/sync-motoristas/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncMotoristas } from "@/server/services/sync-motoristas";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret");

  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncMotoristas();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] sync-motoristas failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create veiculos cron endpoint**

Create `src/app/api/cron/sync-veiculos/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { syncVeiculos } from "@/server/services/sync-veiculos";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Cron-Secret");

  if (secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncVeiculos();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] sync-veiculos failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/
git commit -m "feat: add cron endpoints for motorista and veiculo sync"
```

---

### Task 12: Dkron Job Registration Service

**Files:**
- Create: `src/server/services/dkron.ts`

- [ ] **Step 1: Create Dkron service**

Create `src/server/services/dkron.ts`:
```typescript
import { env } from "@/lib/env";

interface DkronJob {
  name: string;
  schedule: string;
  executor: string;
  executor_config: Record<string, string>;
}

async function upsertJob(job: DkronJob): Promise<void> {
  const response = await fetch(`${env.DKRON_URL}/v1/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(job),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Dkron upsert failed for ${job.name}: ${response.status} ${body}`);
  }
}

export async function registerDkronJobs(): Promise<void> {
  const jobs: DkronJob[] = [
    {
      name: "sync-motoristas",
      schedule: env.SYNC_MOTORISTAS_CRON,
      executor: "http",
      executor_config: {
        method: "POST",
        url: `${env.APP_BASE_URL}/api/cron/sync-motoristas`,
        headers: JSON.stringify({ "X-Cron-Secret": env.CRON_SECRET }),
      },
    },
    {
      name: "sync-veiculos",
      schedule: env.SYNC_VEICULOS_CRON,
      executor: "http",
      executor_config: {
        method: "POST",
        url: `${env.APP_BASE_URL}/api/cron/sync-veiculos`,
        headers: JSON.stringify({ "X-Cron-Secret": env.CRON_SECRET }),
      },
    },
  ];

  for (const job of jobs) {
    try {
      await upsertJob(job);
      console.log(
        JSON.stringify({
          level: "info",
          context: "dkron",
          message: `Job registered: ${job.name}`,
        })
      );
    } catch (error) {
      console.warn(
        JSON.stringify({
          level: "warn",
          context: "dkron",
          message: `Failed to register job: ${job.name}`,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
```

> Note: Dkron accepts standard cron expressions directly in the `schedule` field. The env var holds the cron expression (e.g., `0 */6 * * *`).

- [ ] **Step 2: Register Dkron jobs on app startup**

Modify `src/app/layout.tsx` — add a server-side call to register jobs. In Next.js App Router, use `instrumentation.ts` at the project root for startup logic:

Create `src/instrumentation.ts`:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerDkronJobs } = await import("@/server/services/dkron");
    registerDkronJobs().catch((error) => {
      console.warn("[startup] Dkron registration failed, continuing:", error);
    });
  }
}
```

Enable instrumentation in `next.config.ts` (add `experimental.instrumentationHook: true` if needed — Next.js 16 may support it by default).

- [ ] **Step 3: Commit**

```bash
git add src/server/services/dkron.ts src/instrumentation.ts
git commit -m "feat: add Dkron job registration service with startup hook"
```

---

### Task 13: Dashboard Layout and Placeholder Pages

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/motoristas/page.tsx`, `src/app/(dashboard)/veiculos/page.tsx`

- [ ] **Step 1: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:
```tsx
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-lg font-bold">Fretefy</h2>
        <nav className="space-y-2">
          <Link href="/motoristas" className="block rounded p-2 hover:bg-gray-200">
            Motoristas
          </Link>
          <Link href="/veiculos" className="block rounded p-2 hover:bg-gray-200">
            Veiculos
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create placeholder pages**

Create `src/app/(dashboard)/motoristas/page.tsx`:
```tsx
export default function MotoristasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Motoristas</h1>
      <p className="text-gray-500">Placeholder — UI sera implementada na fase 2.</p>
    </div>
  );
}
```

Create `src/app/(dashboard)/veiculos/page.tsx`:
```tsx
export default function VeiculosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Veiculos</h1>
      <p className="text-gray-500">Placeholder — UI sera implementada na fase 2.</p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/
git commit -m "feat: add dashboard layout and placeholder pages"
```

---

### Task 14: Docker Setup

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

- [ ] **Step 2: Enable standalone output in next.config.ts**

Add `output: "standalone"` to `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 3: Create .dockerignore**

Create `.dockerignore`:
```
node_modules
.next
.git
.env.dev
.env.prd
dkron_data
```

- [ ] **Step 4: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
services:
  app:
    build: .
    restart: always
    env_file:
      - .env.prd
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

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore next.config.ts
git commit -m "feat: add Docker setup with multi-stage build and Dkron"
```

---

### Task 15: Final Verification

- [ ] **Step 1: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (or only expected warnings about env vars not being set)

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes successfully

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve build issues"
```