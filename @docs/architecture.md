# Arsitektur Monorepo Katauser

Dokumentasi arsitektur sistem open-source Katauser (Customer Feedback, Public Roadmap, Changelog, In-App Widget, Live Chat, dan AI Agent Juno).

---

## 1. Topologi Monorepo

Project ini menggunakan **pnpm workspaces** yang diorkestrasikan oleh **Turborepo** (`turbo.json`):

```
katauser-app/
├── apps/
│   ├── api/            # Hono REST & RPC API backend (Node.js/Bun)
│   └── web/            # SvelteKit SSR & SPA Admin/Public Frontend (Svelte 5)
├── packages/
│   ├── db/             # Drizzle ORM PostgreSQL 16 + pgvector schema & repositories
│   ├── shared/         # Zod schemas, validation helpers, contract types
│   ├── widget/         # Svelte 5 Custom Element embeddable script (< 28 kB)
│   └── tsconfig/       # Base TypeScript configurations
├── docker/             # Production multi-stage Dockerfiles & Docker Compose
└── @docs/              # Dokumentasi arsitektur & operasional sistem
```

---

## 2. Strict Decoupled API Model

- **Hono Backend (`apps/api`)** bertindak sebagai **single source of truth** untuk:
  - Seluruh interaksi database via Drizzle ORM (`@katauser/db`).
  - RPC Type Export (`AppType`) untuk end-to-end type safety tanpa codegen.
  - Rate limiting (Redis/memory with trusted proxy support).
  - SSE Streaming (`streamSSE`) untuk respon percakapan AI Agent Juno (`POST /api/v1/chat/conversations/:id/juno-stream`).
  - Semantic Duplicate Detection & Cosine Similarity search untuk feedback posts.
  - DNS CNAME verification untuk custom domain tenant.
- **SvelteKit Frontend (`apps/web`)** bertindak sebagai **pure UI & SSR consumer**:
  - Mengakses API Hono melalui `hc<AppType>(API_BASE_URL)`.
  - Menggunakan Svelte 5 Runes (`$state`, `$derived`, `$props`, `$effect`).
  - Menangani dynamic domain routing via SvelteKit Server Hook (`src/hooks.server.ts`), meneruskan custom hostname ke portal publik workspace tanpa mengubah address bar browser.

---

## 3. Data & Storage Model (`@katauser/db`)

Menggunakan **PostgreSQL 16** dengan extension `pgvector` dan schema modular Drizzle:

| Domain | Tabel | Deskripsi |
|---|---|---|
| **Auth & Core** | `users`, `workspaces`, `workspace_members` | Multi-tenant tenant scoping & RBAC |
| **Feedback** | `boards`, `posts`, `post_votes`, `post_comments` | Feedback collection, traits/MRR tracking, & upvoting engine |
| **Roadmap & Changelog** | `changelog_entries`, `changelog_notifications` | Roadmap grouping (Planned/In Progress/Completed) & release logs |
| **Chat & Juno AI** | `conversations`, `messages` | Real-time chat session, AI vs Human handoff status, SSE streaming history |
| **AI & Knowledge** | `knowledge_embeddings` | Text chunks & 1536-dim vector embeddings (`pgvector`) untuk RAG docs |
| **Domains** | `custom_domains` | Domain CNAME/Apex verification status (`unverified`, `pending`, `active`) |

---

## 4. In-App Widget (`@katauser/widget`)

- Dibangun menggunakan **Svelte 5** dengan target kompilasi Custom Element (`<katauser-widget>`).
- Output berukuran **27.11 kB gzipped** (`dist/katauser.js`), di-bundle mandiri oleh Vite (IIFE) dengan seluruh CSS terisolasi di dalam **Shadow DOM**.
- Terintegrasi dengan backend via HMAC SHA-256 identity verification (`POST /api/v1/widget/identify`) serta mendukung pengiriman custom traits (`plan`, `mrr`).

---

## 5. Security & Rate Limiting

- **Trusted Proxy Awareness**: Middleware membaca `cf-connecting-ip` (Cloudflare) dan `x-forwarded-for` (Traefik/Coolify).
- **HMAC Identity Verification**: Validasi identitas user widget menggunakan workspace secret token (`crypto.createHmac('sha256')`).
- **Sliding-window Rate Limiter**: Membatasi brute-force verifikasi DNS dan abuse API.

---

## 6. Deep AI & RAG Engine

- **1536-dim Vector Embeddings**: Menggunakan OpenAI `text-embedding-3-small` (dengan fallback deterministik normalized mock saat testing/offline).
- **Cosine Similarity Engine**: Membandingkan vektor dokumen dan query untuk semantic search dan real-time duplicate post suggestions.
- **RAG SSE Streaming**: Juno menarik konteks dari artikel dokumentasi yang relevan saat membalas pertanyaan pelanggan di widget live chat.

---

## 7. Outbound Integrations (Slack, Discord & Resend)

- **Webhook Dispatcher**: Mengirimkan notifikasi ke Slack (Block Kit) dan Discord (Rich Embeds) saat ide baru dibuat, vote masuk, atau live chat dieskalasi ke manusia.
- **Transactional Voter Email**: Menggunakan Resend API untuk mengirimkan kabar rilis secara otomatis kepada para pemilih saat fitur selesai dirilis.
