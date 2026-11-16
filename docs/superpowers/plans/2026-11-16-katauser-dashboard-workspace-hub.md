# Katauser Workspace Hub & Unified Dashboard Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menggantikan template dummy lama pada `/account` dengan Workspace Hub interaktif (daftar workspace, buat workspace baru, pintasan cepat), membuat unified dashboard layout di `/dashboard/[workspaceSlug]`, dan mengeliminasi error 404 pada root workspace.

**Architecture:**

- Svelte 5 Runes + daisyUI + Tailwind CSS v4 + `lucide-svelte`.
- Hub User: `apps/web/src/routes/(admin)/account/(menu)/+page.svelte` & `+page.server.ts`.
- Root Workspace Redirect: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/+page.server.ts`.
- Unified Dashboard Layout: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/+layout.svelte` & `+layout.server.ts`.
- Pembersihan header terfragmentasi dan emoji di halaman-halaman `dashboard/[workspaceSlug]/*`.

## Antislop Guidelines

- Tidak ada emoji/emoticon pada antarmuka admin (gunakan `lucide-svelte` icons).
- Warna badge status konsisten (Planned = biru, In Progress = oranye/kuning, Completed = hijau).
- Layout terstruktur: sidebar responsif di desktop dan drawer di mobile.

---

### Task 1: Root Workspace Redirect & Server Loaders

**Files:**

- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/+page.server.ts`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/+layout.server.ts`

- [ ] Implementasikan redirect otomatis dari `/dashboard/[workspaceSlug]` ke `/dashboard/[workspaceSlug]/boards`.
- [ ] Validasi autentikasi user dan muat data workspace dasar di `+layout.server.ts`.

### Task 2: Unified Dashboard Layout (`+layout.svelte`)

**Files:**

- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/+layout.svelte`

- [ ] Buat layout admin dengan sidebar/navbar terpadu:
  - Header brand & nama workspace aktif.
  - Menu navigasi: Feedback Boards, Live Support Inbox, Tulis Changelog.
  - Menu Pengaturan: Custom Domain, Integrasi Webhook, AI Juno Docs.
  - Pintasan "Lihat Portal Publik" (`/b/[workspaceSlug]`).
  - Drawer responsif untuk layar mobile.

### Task 3: Refactor Sub-Halaman Dashboard (Hapus Header Duplikat & Emoji)

**Files:**

- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/+page.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/inbox/+page.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/changelog/new/+page.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/domain/+page.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/integrations/+page.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/ai/+page.svelte`

- [ ] Hapus header ad-hoc duplikat dan gantikan emoji dengan ikon `lucide-svelte` di setiap sub-halaman dashboard.
- [ ] Pastikan konten halaman pas di dalam unified layout.

### Task 4: Workspace Hub di `/account`

**Files:**

- Modify: `apps/web/src/routes/(admin)/account/(menu)/+page.server.ts`
- Modify: `apps/web/src/routes/(admin)/account/(menu)/+page.svelte`

- [ ] Muat data workspaces milik user (atau workspace demo default) di `+page.server.ts`.
- [ ] Tambahkan server action untuk membuat workspace baru via API.
- [ ] Rombak tampilan `+page.svelte`: Greeting user, kartu workspace aktif, tombol buat workspace, dan link langsung ke dashboard.

### Task 5: Testing, Build & Quality Gate

**Files:**

- Create: `apps/web/tests/dashboard-layout.test.ts`
- Run: `pnpm --filter @katauser/web check && pnpm --filter @katauser/web test && pnpm turbo run build`

- [ ] Jalankan vitest dan pastikan semua pengujian lulus.
- [ ] Jalankan svelte-check untuk memastikan 0 error dan 0 warning.
- [ ] Verifikasi build produksi dan merge ke branch `main`.
