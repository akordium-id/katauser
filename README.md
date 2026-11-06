# Katauser

<p align="center">
  <strong>Open-Source Alternative to UserJot, Canny, and Featurebase.</strong><br>
  All-in-one Customer Feedback, Public Roadmap, Changelog, In-App Widget, and RAG-Powered AI Support Agent (Juno).
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License"></a>
  <a href="https://turbo.build/repo"><img src="https://img.shields.io/badge/Monorepo-Turborepo-ef4444.svg" alt="Turborepo"></a>
  <a href="https://svelte.dev"><img src="https://img.shields.io/badge/Frontend-Svelte%205%20%2B%20SvelteKit-ff3e00.svg" alt="SvelteKit"></a>
  <a href="https://hono.dev"><img src="https://img.shields.io/badge/Backend-Hono%20API-e36002.svg" alt="Hono"></a>
  <a href="https://orm.drizzle.team"><img src="https://img.shields.io/badge/Database-Drizzle%20%2B%20pgvector-3b82f6.svg" alt="Drizzle ORM"></a>
</p>

---

## ✨ Fitur Utama (Features)

Katauser dirancang untuk membantu startup, founder SaaS, dan software agency menutup siklus feedback pengguna (*feedback loop*) secara transparan dan otomatis:

- 💡 **Feedback Boards & Upvoting Loop**: Kumpulkan saran fitur, ide pengguna, dan laporan bug. Dilengkapi sorting berbasis popularitas serta **Revenue-Weighted Sorting** (mengetahui nilai akumulasi MRR dari para pemilih).
- 🔍 **Real-Time Semantic Duplicate Detection**: Mencegah duplikasi backlog masukan menggunakan vector embeddings & cosine similarity (`pgvector`) saat pengguna mengetik judul ide.
- 🗺️ **Public Roadmap Kanban**: Publikasikan tahapan rilis fitur (*Planned*, *In Progress*, *Shipped*) secara real-time yang terhubung langsung dengan board masukan.
- 🚀 **AI-Powered Changelog & Auto-Notifications**: Publikasikan catatan rilis dan beri tahu semua voter secara otomatis melalui email transaksional (**Resend**) saat fitur yang mereka dukung telah selesai dirilis.
- 🤖 **Live Chat & AI Support Agent (Juno)**: Asisten dukungan live chat cerdas dengan **RAG (Retrieval-Augmented Generation)** yang mempelajari website docs & FAQ Anda, dengan dukungan SSE streaming dan handoff otomatis ke staf manusia.
- 📦 **In-App Widget (< 28 kB gzipped)**: Web Component Custom Element mandiri (`<katauser-widget>`) di dalam **Shadow DOM** tanpa bentrok dengan CSS aplikasi induk, lengkap dengan verifikasi identitas HMAC SHA-256.
- 🌐 **Multi-Tenant Custom Domains**: Hubungkan domain kustom tenant Anda (misal `feedback.yourcompany.com`) dengan verifikasi DNS CNAME instan dan transparent routing middleware.
- 💬 **Outbound Webhooks (Slack & Discord)**: Notifikasi real-time ke channel tim Anda saat ada feedback baru (`post.created`), upvote baru (`post.voted`), atau eskalasi chat (`chat.escalated`).

---

## 🏗️ Arsitektur Monorepo

Katauser menggunakan **pnpm workspaces** yang diorkestrasikan oleh **Turborepo**:

```text
katauser-app/
├── apps/
│   ├── api/            # Hono REST & RPC API backend (Node.js/Bun)
│   └── web/            # SvelteKit SSR & SPA Admin/Public Frontend (Svelte 5 Runes)
├── packages/
│   ├── db/             # Drizzle ORM PostgreSQL 16 + pgvector schema & repositories
│   ├── shared/         # Zod schemas, constants, contract types, dan validation helpers
│   ├── widget/         # Svelte 5 Custom Element embeddable script (< 28 kB gzipped)
│   └── tsconfig/       # Base TypeScript configurations
├── docker/             # Production multi-stage Dockerfiles & Docker Compose
└── @docs/              # Dokumentasi arsitektur, panduan integrasi, & deployment
```

---

## 🚀 Quick Start (Local Development)

### 1. Prasyarat Lingkungan
- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker & Docker Compose** (untuk PostgreSQL 16 + pgvector dan Redis)

### 2. Menjalankan Database Lokal
```bash
docker compose -f docker/docker-compose.dev.yml up -d
```
Service lokal yang aktif:
- PostgreSQL 16 (pgvector): `localhost:5432` (`postgres:postgres@localhost:5432/katauser`)
- Redis: `localhost:6379`

### 3. Install Dependensi & Setup Env
```bash
# Clone repository
git clone https://github.com/your-username/katauser.git
cd katauser

# Install dependensi monorepo
pnpm install

# Setup environment variables (opsional untuk OpenAI & Resend)
cp .env.example .env # atau set di apps/api/.env dan apps/web/.env
```

### 4. Menjalankan Server Development
```bash
# Jalankan seluruh service (API :3000 / :4000, Web :5173)
pnpm dev
```

Buka di browser:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000` (Healthcheck: `http://localhost:3000/api/v1/health`)

### 5. Pengujian & Build
```bash
# Type check di seluruh paket
pnpm check

# Unit & integration tests di seluruh paket
pnpm test

# Full production build via Turborepo
pnpm build
```

---

## 📦 In-App Widget Embed

Cukup pasang snippet berikut di aplikasi web Anda:

```html
<script src="https://katauser.com/widget/katauser.js" async defer></script>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    if (window.Katauser) {
      window.Katauser.init({
        workspaceSlug: 'your-workspace',
        primaryColor: '#2563eb',
        position: 'bottom-right'
      });

      // Opsional: Identifikasi user & custom traits (MRR/Plan)
      window.Katauser.identify({
        userId: 'usr_12345',
        email: 'user@company.com',
        name: 'Budi Santoso',
        traits: { plan: 'pro', mrr: 150 },
        hmacSignature: '...' // Generate dari backend Anda
      });
    }
  });
</script>
```

Panduan integrasi selengkapnya dapat dibaca di [`@docs/widget-integration.md`](@docs/widget-integration.md).

---

## 🚢 Deployment (Self-Hosted / VPS Coolify)

Katauser dirancang agar dapat di-deploy secara mandiri (*self-hosted*) dengan mudah menggunakan Docker Compose atau Coolify di VPS pribadi:

- **Docker Compose Production**: [`docker/docker-compose.prod.yml`](docker/docker-compose.prod.yml)
- **Multi-Stage Dockerfiles**: [`docker/Dockerfile.api`](docker/Dockerfile.api) & [`docker/Dockerfile.web`](docker/Dockerfile.web)

Panduan deployment langkah-demi-langkah tersedia di:
📖 **[`@docs/deployment-coolify.md`](@docs/deployment-coolify.md)**

---

## 📚 Dokumentasi Lengkap (`@docs/`)

- [📐 Arsitektur Sistem & Data Model](@docs/architecture.md)
- [🤖 RAG AI Agent Juno & Ingestion Docs](@docs/ai-rag-juno.md)
- [💬 Webhooks & Email Notifications](@docs/integrations-webhooks.md)
- [📦 Panduan Integrasi Widget SDK](@docs/widget-integration.md)
- [🌐 Panduan Deployment di Coolify](@docs/deployment-coolify.md)

---

## 🤝 Berkontribusi (Contributing)

Kontribusi sangat terbuka! Jika Anda ingin memperbaiki bug, menambahkan fitur, atau meningkatkan dokumentasi:

1. Fork repository ini.
2. Buat feature branch baru (`git checkout -b feature/nama-fitur`).
3. Pastikan semua pengujian lulus (`pnpm check && pnpm test`).
4. Commit perubahan Anda (`git commit -m "feat: deskripsi fitur"`).
5. Push ke branch Anda (`git push origin feature/nama-fitur`).
6. Buka **Pull Request**.

---

## 📄 Lisensi (License)

Didistribusikan di bawah lisensi **Apache-2.0 License**. Lihat [`LICENSE`](LICENSE) untuk informasi lebih lanjut.
