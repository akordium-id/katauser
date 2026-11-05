# Katauser: Technical Architecture & Monorepo Design Specification

**Document Version:** 1.0.0  
**Date:** 2026-11-05  
**Status:** Approved / Ready for Implementation  
**Target Architecture:** Monorepo (pnpm + Turborepo) with SvelteKit + Hono (Decoupled RPC)  
**Target Environment:** Self-Hosted Linux VPS (Coolify / Docker / Nixpacks)

---

## 1. Executive Summary & Goals

**Katauser** adalah platform customer feedback loop dan support all-in-one untuk produk SaaS (terinspirasi dari UserJot):
1. **Feedback Board**: Ide, voting, diskusi, tagging, moderasi (publik & privat).
2. **Roadmap**: Kanban publik sinkron otomatis dengan status post feedback.
3. **Changelog**: Publikasi update rilis tertaut ke post feedback + auto-notifikasi email ke pemilih fitur (voters).
4. **Live Chat & Inbox**: Shared inbox untuk support tim dan visitor.
5. **AI Agent "Juno"**: Agen support berbasis RAG yang memahami konteks produk (docs, changelog, status roadmap) dan memiliki kemampuan function/tool calling (voting atas nama user, handoff ke manusia).
6. **Embeddable In-App Widget**: Script embed ultra-ringan (<35KB) yang mengintegrasikan chat, feedback, roadmap, dan changelog ke website pelanggan tanpa bentrok CSS (Shadow DOM).

Katauser didesain sebagai **multi-tenant SaaS** dengan arsitektur **Strict Decoupled API**: Hono menangani semua logika bisnis dan database, sementara SvelteKit bertindak sebagai UI consumer murni via type-safe RPC client (`hc<AppType>`).

---

## 2. Tech Stack Matrix

| Layer | Pilihan Teknologi | Alasan Pemilihan |
|---|---|---|
| **Monorepo Manager** | pnpm Workspaces + Turborepo | Isolasi dependensi ketat, fast build caching, integrasi Docker multi-stage |
| **Frontend Web** | SvelteKit 2 + Svelte 5 (Runes) | SSR cepat untuk SEO public roadmap/board, performa runtime reaktif ultra-ringan |
| **Styling & UI** | Tailwind CSS v4 + Bits UI (shadcn-svelte) | UI modern, aksesibel, mudah di-customize |
| **Backend API** | Hono v4 (`@hono/node-server`) | Standar Web Fetch API, blazing fast, native RPC type safety, WebSocket support |
| **Database & ORM** | PostgreSQL 16 + Drizzle ORM | Type-safety SQL, performa query native tinggi, migrasi terkontrol |
| **Vector Engine** | PostgreSQL `pgvector` (`vector(1536)`) | Menggabungkan data relasional dan vektor dalam satu DB tanpa biaya vector DB terpisah |
| **Authentication** | Better Auth + JWT SSO | First-class Drizzle adapter, 2FA, OAuth, dan JWT signing untuk widget identify |
| **Realtime Engine** | `@hono/node-ws` + Redis Pub/Sub | WebSockets untuk live chat, scaling horizontal multi-container |
| **Background Jobs** | BullMQ + Redis | Antrean email batch, chunking docs, dan embedding background worker |
| **AI Orchestration**| Vercel AI SDK (`ai`) | Provider-agnostic (Claude 3.5, GPT-4o, Groq, Ollama), streaming, tool calling |
| **Storage** | S3-Compatible (Cloudflare R2 / MinIO) | Penyimpanan tangkapan layar, lampiran chat, dan avatar |
| **Deployment** | Coolify (Docker) di VPS | Kendali penuh, zero-vendor-lockin, trusted proxy via Traefik |

---

## 3. Monorepo Structure

```text
katauser/
├── apps/
│   ├── api/                      # Backend API Service (Hono)
│   │   ├── src/
│   │   │   ├── index.ts          # Server entry point (@hono/node-server)
│   │   │   ├── app.ts            # Hono application root (export type AppType)
│   │   │   ├── middleware/       # Auth, Tenant Context, CORS, Rate Limit
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Better Auth instance & session endpoints
│   │   │   │   ├── workspaces/   # Workspace CRUD, members, custom domain
│   │   │   │   ├── boards/       # Feedback boards, posts, voting, comments
│   │   │   │   ├── roadmap/      # Roadmap board status & sync
│   │   │   │   ├── changelog/    # Releases & automatic voter notifications
│   │   │   │   ├── conversations/# Live chat threads, WebSocket handling
│   │   │   │   ├── ai/           # Juno Agent (RAG query + tool calling)
│   │   │   │   └── widget/       # Public widget bootstrap & JWT identify
│   │   │   └── lib/              # Redis client, BullMQ queues, AI SDK client
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                      # Frontend Application (SvelteKit)
│       ├── src/
│       │   ├── lib/
│       │   │   ├── api.ts        # Typed Hono RPC client (hc<AppType>)
│       │   │   ├── components/   # UI components
│       │   │   └── stores/       # Global runes & state
│       │   └── routes/
│       │       ├── (marketing)/  # Landing page, pricing, documentation
│       │       ├── (app)/        # Admin Dashboard (/dashboard, /workspaces/...)
│       │       └── (public)/     # Public SSR Portals (/b/[slug], /roadmap, /changelog)
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── db/                       # Database Package (Drizzle ORM + Migrations)
│   │   ├── src/
│   │   │   ├── index.ts          # Drizzle client instance (Node-postgres pool)
│   │   │   └── schema/           # Modular table schemas
│   │   │       ├── auth.ts       # Better Auth tables (users, sessions, accounts)
│   │   │       ├── workspaces.ts # Workspaces, members, roles
│   │   │       ├── feedback.ts   # Boards, posts, votes, comments, tags
│   │   │       ├── changelog.ts  # Changelog entries, changelog_posts
│   │   │       ├── chat.ts       # Conversations, messages, end_users
│   │   │       └── ai.ts         # knowledge_embeddings (pgvector)
│   │   ├── drizzle/              # Generated SQL migration files
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── shared/                   # Shared Schemas & DTOs
│   │   ├── src/
│   │   │   ├── schemas/          # Zod validation schemas
│   │   │   ├── types/            # TypeScript interfaces & enums
│   │   │   └── constants/        # Post statuses, role permissions
│   │   └── package.json
│   │
│   ├── widget/                   # Embeddable Script (<script src="...">)
│   │   ├── src/                  # Svelte 5 Web Component (Shadow DOM)
│   │   ├── vite.config.ts        # Single bundle build -> dist/katauser.js
│   │   └── package.json
│   │
│   └── tsconfig/                 # Shared TypeScript configurations
│
├── docker/                       # Docker compose & deployment manifests
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. End-to-End Type Safety: Hono RPC Contract

SvelteKit mengonsumsi Hono API menggunakan `hono/client` tanpa perantara codegen GraphQL atau OpenAPI generator.

### 4.1 Definisi Route di Hono (`apps/api`)
```typescript
// apps/api/src/app.ts
import { Hono } from 'hono';
import { postsRoute } from './modules/boards/posts.route';
import { changelogRoute } from './modules/changelog/changelog.route';

export const app = new Hono()
  .basePath('/api/v1')
  .route('/posts', postsRoute)
  .route('/changelog', changelogRoute);

export type AppType = typeof app;
```

### 4.2 Inisialisasi RPC Client di SvelteKit (`apps/web`)
```typescript
// apps/web/src/lib/api.ts
import { hc } from 'hono/client';
import type { AppType } from '@katauser/api';
import { env } from '$env/dynamic/public';

export function createApiClient(fetchFn: typeof fetch, authToken?: string) {
  // SSR menggunakan internal URL (mis. http://katauser-api:4000), Browser memanggil public domain
  const baseUrl = typeof window === 'undefined' 
    ? (process.env.INTERNAL_API_URL || 'http://localhost:4000') 
    : (env.PUBLIC_API_URL || 'https://api.katauser.com');

  return hc<AppType>(baseUrl, {
    fetch: fetchFn,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  });
}
```

---

## 5. Multi-tenancy & Data Model Specification

### 5.1 Dual-Identity System
1. **Team Members (`users`)**:
   - Dikelola oleh **Better Auth**.
   - Terikat ke satu atau banyak workspace melalui relasi di `workspace_members`.
2. **Customer End-Users (`end_users`)**:
   - Pengunjung publik atau user dari aplikasi customer.
   - Diautentikasi via **JWT SSO (HMAC-SHA256)** yang ditandatangani oleh backend customer menggunakan `workspace.jwt_secret`.
   - Data tersimpan di tabel `end_users` dengan partisi logis `workspace_id`.

### 5.2 Schema Entitas Inti (`packages/db`)

```sql
-- Workspaces
CREATE TABLE workspaces (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(64) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  jwt_secret VARCHAR(64) NOT NULL,
  plan VARCHAR(32) DEFAULT 'free' NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Boards & Posts
CREATE TABLE boards (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(64) NOT NULL,
  is_private BOOLEAN DEFAULT FALSE NOT NULL,
  allow_guest_posts BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE posts (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id VARCHAR(36) REFERENCES boards(id) ON DELETE CASCADE,
  end_user_id VARCHAR(36) REFERENCES end_users(id) ON DELETE SET NULL,
  team_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(32) DEFAULT 'pending' NOT NULL, -- pending, planned, in_progress, completed, closed
  votes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Votes & Voters Tracking
CREATE TABLE votes (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  post_id VARCHAR(36) REFERENCES posts(id) ON DELETE CASCADE,
  end_user_id VARCHAR(36) REFERENCES end_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, end_user_id)
);

-- Changelogs & Auto-notify Links
CREATE TABLE changelogs (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE changelog_posts (
  changelog_id VARCHAR(36) REFERENCES changelogs(id) ON DELETE CASCADE,
  post_id VARCHAR(36) REFERENCES posts(id) ON DELETE CASCADE,
  PRIMARY KEY (changelog_id, post_id)
);

-- Live Chat & Conversations
CREATE TABLE conversations (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  end_user_id VARCHAR(36) REFERENCES end_users(id) ON DELETE CASCADE,
  status VARCHAR(32) DEFAULT 'open' NOT NULL, -- open, pending, closed
  assigned_to VARCHAR(32) DEFAULT 'ai_juno' NOT NULL, -- ai_juno, human
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(16) NOT NULL, -- end_user, agent, ai
  sender_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Knowledge Base Vector Store for Juno AI
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_embeddings (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type VARCHAR(32) NOT NULL, -- doc, post, changelog, faq
  source_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_embeddings_workspace_vector ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 6. Embed Widget Architecture (`packages/widget`)

### 6.1 Shadow DOM Encapsulation
Widget di-compile menggunakan Svelte 5 Custom Element:
- Tag HTML: `<katauser-widget>`
- Semua style CSS di-inject ke dalam `shadowRoot`, menjamin 0% risiko tabrakan CSS dengan style website host pelanggan.
- Bundle output: Single JS file berukuran `< 35KB` (gzipped).

### 6.2 Host Integration Snippet
```html
<script src="https://app.katauser.com/widget.js" data-workspace="my-saas" defer></script>
<script>
  window.Katauser?.('identify', {
    token: 'SIGNED_JWT_FROM_BACKEND'
  });
</script>
```

### 6.3 Komponen Internal Widget
- **Launcher Bubble**: Ikon mengambang di pojok layar dengan indikator unread message.
- **Tab Navigation**:
  - `Chat`: Percakapan real-time dengan Juno AI atau customer agent.
  - `Feedback`: Form kirim feedback, pencarian instan untuk cegah duplikasi ide, dan upvote.
  - `Roadmap`: Melihat status fitur (Planned / In Progress).
  - `Changelog`: Melihat release notes terbaru.

---

## 7. Realtime Engine & AI Agent "Juno"

### 7.1 Realtime Communication
- Menggunakan `@hono/node-ws` di Node.js server.
- **Redis Pub/Sub**: Menjembatani pesan antar-worker sehingga klien yang tersambung ke container A dapat menerima broadcast dari agent di container B.
- **Event Flow**:
  - `message:created`: Mengalirkan pesan baru ke visitor & admin inbox.
  - `typing:status`: Menampilkan indikator pengetikan.
  - `post:voted`: Pembaruan counter vote realtime di public board.

### 7.2 Juno Agent Workflow
- Didukung oleh **Vercel AI SDK (`ai`)**.
- **Context Injection (RAG)**:
  1. Pertanyaan visitor diubah menjadi embedding via `text-embedding-3-small` (atau local Ollama).
  2. Dilakukan cosine distance search pada tabel `knowledge_embeddings` dengan `WHERE workspace_id = current_workspace_id`.
  3. Dokumen teratas disuntikkan ke system prompt Juno.
- **Tools / Function Calling**:
  - `searchRoadmap({ query })`: Mencari fitur dan mengembalikan statusnya.
  - `createFeedbackPost({ title, details, boardId })`: Membuatkan feedback post atas persetujuan user.
  - `upvotePost({ postId })`: Menambahkan vote user ke post yang sudah ada.
  - `handoffToHuman({ reason, summary })`: Mengalihkan conversation ke tim support manusia dan memicu webhook alert (Slack/Discord/Email).

---

## 8. Deployment & Infrastructure (Coolify VPS)

### 8.1 Docker Multi-Service Topology

```
[Traefik / Coolify Ingress] (SSL On-Demand untuk Custom Domain)
       │
       ├──► katauser-web (SvelteKit SSR) [Port 3000]
       ├──► katauser-api (Hono REST/WS)   [Port 4000]
       │
       ▼ (Internal Bridge Network)
┌──────────────────────────────────────────────┐
│ katauser-worker (BullMQ background tasks)    │
│ Postgres 16 (pgvector)                       │
│ Redis 7 (Cache, Queue, WebSocket Pub/Sub)    │
│ S3 / Cloudflare R2 / MinIO                   │
└──────────────────────────────────────────────┘
```

### 8.2 Environment & Proxy Handling
- SvelteKit di-deploy dengan `@sveltejs/adapter-node` dan konfigurasi `trustProxy: true` agar membaca header `x-forwarded-for` dan `x-forwarded-proto` secara tepat di belakang Traefik.
- Dynamic CORS di Hono: Meninjau domain pemanggil widget terhadap whitelist custom domain workspace yang tersimpan di cache Redis.

---

## 9. Phased Implementation Roadmap

1. **Fase 1: Monorepo Foundation & Data Layer**
   - Inisialisasi pnpm workspace & Turborepo.
   - Konfigurasi `packages/db` (Drizzle + PostgreSQL + pgvector).
   - Setup Better Auth & skema multi-tenant awal.
   - Setup `apps/api` (Hono basic routing & health check) + `apps/web` (SvelteKit basic SSR).
2. **Fase 2: Feedback Board & Voting Loop**
   - Modul Boards, Posts, Upvotes, Comments di Hono.
   - Hono RPC client binding ke SvelteKit.
   - UI Admin Dashboard & Public Feedback Portal.
3. **Fase 3: Roadmap & Changelog with Auto-Notifications**
   - Modul Roadmap (Kanban status) & sync dari post feedback.
   - Modul Changelog & linking ke post feedback.
   - BullMQ worker untuk pengiriman notifikasi email batch via Resend ke voters.
4. **Fase 4: Embed Widget Package**
   - Setup `packages/widget` dengan Svelte 5 Custom Element (Shadow DOM).
   - Build pipeline Vite single-bundle `katauser.js`.
   - Widget identify SSO JWT verification endpoint di Hono.
5. **Fase 5: Live Chat & AI Agent Juno**
   - Setup WebSocket server & Redis Pub/Sub di Hono.
   - Shared Inbox UI di dashboard SvelteKit.
   - Integrasi Vercel AI SDK, pipeline RAG pgvector, dan tool calling Juno.
6. **Fase 6: Custom Domain & Production Hardening**
   - Reverse proxy routing & wildcard SSL handling di Coolify.
   - Docker multi-stage build optimization.

