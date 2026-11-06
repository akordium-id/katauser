# Katauser Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun landing page modern, berkarakter, dan bebas dari AI slop untuk Katauser (Open Source User Feedback & Roadmap Platform), lengkap dengan hero demo interaktif, perbandingan biaya self-host vs Canny, dan integrasi antislop UI/copywriting.

**Architecture:** 
- Svelte 5 + Tailwind CSS + daisyUI komponen responsif.
- Modular sections di `apps/web/src/routes/(marketing)/`:
  - `apps/web/src/routes/(marketing)/+layout.svelte`: Header navigasi & footer resmi Katauser.
  - `apps/web/src/routes/(marketing)/+page.svelte`: Komposisi landing page utama.
  - `apps/web/src/routes/(marketing)/components/HeroDemo.svelte`: Interactive feedback card preview dengan live upvote counter & status tag.
  - `apps/web/src/routes/(marketing)/components/FeatureShowcase.svelte`: 3 pilar produk (Feedback Boards, Public Roadmap Kanban, Changelog).
  - `apps/web/src/routes/(marketing)/components/SelfHostGrid.svelte`: Arsitektur 100% self-hosted di Coolify/Docker.
  - `apps/web/src/routes/(marketing)/components/ComparisonSection.svelte`: Komparasi transparan Katauser vs Canny / Featurebase.
  - `apps/web/src/routes/(marketing)/components/FaqSection.svelte`: Pertanyaan umum teknis & open source.

**Tech Stack:** Svelte 5 Runes (`$state`, `$derived`), Tailwind CSS, daisyUI, TypeScript, Lucide/Heroicons SVG.

## Global Constraints & Antislop Filters
- **No generic AI buzzwords**: Dilarang menggunakan frasa klise seperti *"Unlock potential"*, *"Revolutionize feedback"*, *"Seamless integration"*, *"Supercharge your team"*. Gunakan kalimat teknis, lugas, dan faktual.
- **Purpose test on visuals**: Setiap warna, border, dan badge memiliki makna fungsional (misal: badge `Planned` biru, `In Progress` kuning/oranye, `Completed` hijau).
- **Interactive fidelity**: Komponen demo di Hero harus bisa diklik langsung oleh pengunjung (klik tombol upvote menambah angka, tab status berganti aktif).
- **Zero broken links**: Semua tautan internal mengarah ke `/login/sign_in`, `/login/sign_up`, `/account`, dan GitHub repo Katauser.

---

### Task 1: Navigation Bar & Footer Refactoring
**Files:**
- Modify: `apps/web/src/routes/(marketing)/+layout.svelte`
- Test: Vitest UI / Layout test

- [ ] Update header: logo Katauser, menu (Features, Live Demo, Self-Host, GitHub Star), dan tombol CTA "Sign In" / "Get Started".
- [ ] Update footer: navigasi rapi, branding Akordium / Katauser, link ke dokumentasi Coolify dan lisensi open source.
- [ ] Verifikasi tampilan mobile (responsive drawer/dropdown).

### Task 2: Interactive Hero Section & Live Feedback Card Demo
**Files:**
- Create: `apps/web/src/routes/(marketing)/components/HeroDemo.svelte`
- Modify: `apps/web/src/routes/(marketing)/+page.svelte`

- [ ] Tulis copy hero yang lugas dan tajam: Value proposition User Feedback + Roadmap + In-App Widget 100% Self-Hosted.
- [ ] Buat komponen interaktif `HeroDemo.svelte`: Card feedback dengan toggle upvote interaktif (state reaktif Svelte 5 `$state(42) -> $state(43)`), status badge, dan AI duplicate detection badge preview.
- [ ] Tambahkan dual CTA: *"Mulai Gratis (Self-Host)"* & *"Coba Live Demo"*.

### Task 3: Product Pillars & Feature Showcase (Boards, Roadmap, Changelog, AI)
**Files:**
- Create: `apps/web/src/routes/(marketing)/components/FeatureShowcase.svelte`

- [ ] Showcase 1: **Feedback Boards** (Upvoting, voting anonymously, deteksi duplikasi bertenaga AI Juno).
- [ ] Showcase 2: **Public Roadmap** (Kanban 3 kolom terstruktur: Planned, In Progress, Completed).
- [ ] Showcase 3: **Changelog & In-App Widget** (Embed script mini < 15KB yang bisa dipasang di web customer).
- [ ] Beri visual mockup minimalis yang menyerupai antarmuka asli dashboard.

### Task 4: Self-Hosting & Independence Architecture (The Moat)
**Files:**
- Create: `apps/web/src/routes/(marketing)/components/SelfHostGrid.svelte`

- [ ] Visual stack architecture: PostgreSQL 16 + Redis + Hono + SvelteKit + Coolify/Docker.
- [ ] Highlight keunggulan teknis: Zero vendor lock-in, data milik kamu 100%, tanpa batas kuota user/vote.
- [ ] Copy-paste 1-command deploy: `git clone ... && docker compose up -d`.

### Task 5: Transparent Comparison & FAQ Section
**Files:**
- Create: `apps/web/src/routes/(marketing)/components/ComparisonSection.svelte`
- Create: `apps/web/src/routes/(marketing)/components/FaqSection.svelte`

- [ ] Tabel komparasi: Katauser Community (Free Self-Host) vs Katauser Cloud vs Canny ($79/mo) vs UserJot.
- [ ] FAQ interaktif dengan `<details>` daisyUI accordion: lisensi, requirement server, migrasi data, privasi.
- [ ] Final bottom CTA banner.

### Task 6: Testing & Quality Gate (Antislop Delivery Gate)
**Files:**
- Test: `apps/web/tests/landing-page.test.ts`
- Run: `pnpm --filter @katauser/web check && pnpm --filter @katauser/web test`

- [ ] Buat unit/integration test untuk komponen landing page.
- [ ] Jalankan svelte-check dan vitest untuk memastikan 0 error dan 0 warning.
- [ ] Delivery Gate Antislop: Evaluasi visual contrast, semantic hierarchy, dan ketiadaan slop copy.

