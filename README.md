# Katauser (Monorepo)

Platform all-in-one customer feedback, public roadmap, changelog, dan in-app live chat dengan AI agent (Juno) ala UserJot.

## Arsitektur Monorepo

Proyek ini menggunakan **pnpm workspaces + Turborepo**:

```text
katauser/
├── apps/
│   ├── api/             # Backend API Hono v4 (REST, RPC, WebSockets, AI Juno)
│   └── web/             # Frontend SvelteKit 2 + Svelte 5 (Dashboard & Public SSR)
├── packages/
│   ├── db/              # Drizzle ORM schema (PostgreSQL + pgvector) & migrations
│   ├── shared/          # Shared Zod schemas, constants, dan DTO types
│   ├── widget/          # Embeddable script bundle (Shadow DOM Web Component)
│   └── tsconfig/        # Base TypeScript configurations
├── docker/
│   └── docker-compose.dev.yml # Local PostgreSQL (pgvector) & Redis
```

## Persyaratan Lingkungan

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** & Docker Compose (untuk menjalankan PostgreSQL + pgvector & Redis lokal)

## Quick Start (Local Development)

### 1. Jalankan Database Lokal

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

Service lokal yang aktif:

- PostgreSQL 16 (pgvector): `localhost:5432` (`postgres:postgres@localhost:5432/katauser`)
- Redis: `localhost:6379`

### 2. Install Dependensi Monorepo

```bash
pnpm install
```

### 3. Menjalankan Development Server

Jalankan seluruh service (`apps/api` port 4000 dan `apps/web` port 5173) secara bersamaan:

```bash
pnpm dev
```

Atau jalankan spesifik per workspace:

```bash
pnpm --filter @katauser/api dev
pnpm --filter @katauser/web dev
```

### 4. Build, Type-Check, & Testing

```bash
# Type check di seluruh package
pnpm check

# Unit tests di seluruh package
pnpm test

# Full production build via Turborepo
pnpm build
```

## Deployment di VPS (Coolify)

Katauser didesain untuk deployment mandiri (self-hosted) di VPS menggunakan Docker / Coolify di belakang reverse proxy Traefik / Caddy.
Spesifikasi arsitektur lengkap dapat dibaca di:
[`docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md`](docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md)
