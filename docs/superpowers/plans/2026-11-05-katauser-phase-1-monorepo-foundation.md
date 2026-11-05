# Katauser Phase 1: Monorepo Foundation & Core RPC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyiapkan fondasi monorepo Katauser (pnpm workspaces + Turborepo), paket database (`packages/db` Drizzle + PostgreSQL + pgvector), service API Hono (`apps/api`), paket shared (`packages/shared`), dan frontend SvelteKit (`apps/web`) dengan koneksi end-to-end typed Hono RPC (`hc<AppType>`).

**Architecture:** Monorepo multi-package menggunakan pnpm workspaces dan Turborepo. `apps/api` (Hono v4) mengelola koneksi database Drizzle, otentikasi Better Auth, dan mengekspor kontrak tipe `AppType`. `apps/web` (SvelteKit 2 + Svelte 5) mengonsumsi Hono API secara langsung melalui client typed RPC baik pada SSR maupun di browser.

**Tech Stack:** Node.js 20+, pnpm 9+, Turborepo, SvelteKit 2, Svelte 5, Tailwind CSS v4, Hono v4, Drizzle ORM, PostgreSQL (pgvector), Better Auth, Zod.

**Spec:** [`docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md`](file:///home/orin/code/archive/katauser-app/docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md)

---

## Global Constraints

- Monorepo package manager: `pnpm` workspaces (bukan npm/yarn).
- Database client hanya boleh diimpor oleh `packages/db` dan `apps/api` (SvelteKit `apps/web` tidak boleh mengimpor `@katauser/db` langsung).
- Semua schema input/output API divalidasi dengan Zod di `packages/shared`.
- Kode SvelteKit menggunakan Svelte 5 runes (`$state`, `$derived`, `$props`).
- Konvensi format: Prettier + ESLint, type-checking ketat TypeScript (`strict: true`).

---

## Review Focus

1. **Docker Internal vs Public URL Resolution**: Pada saat SSR di SvelteKit, pemanggilan API harus mengarah ke internal host (`http://katauser-api:4000`), sedangkan di browser mengarah ke `PUBLIC_API_URL`.
2. **Type Inference Chaining di Hono**: Setiap route di Hono harus di-chain dengan `.route()` atau `.get()/.post()` tanpa `void` agar type parameter `AppType` ter-ekspor lengkap ke client.
3. **Workspace Tenant Isolation**: Pastikan tabel-tabel utama di Drizzle (`workspaces`, `users`, `workspace_members`) memiliki index dan foreign key constraint yang benar.
4. **Environment Variables**: Penanganan `.env` monorepo menggunakan file lokal per app atau root level via Turborepo env pass-through.
5. **Clean Legacy Code Separation**: Membersihkan atau memindahkan file starter lama (`cmsassstarter`) agar tidak terjadi konflik dependency saat restrukturisasi.

---

## Implementation Tasks

### Task 1: Restrukturisasi Workspace & Setup Monorepo Tooling

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Modify: `package.json` (root monorepo scripts & dependencies)
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/package.json`

**Steps:**
- [ ] 1. Siapkan file konfigurasi root `pnpm-workspace.yaml` yang mendefinisikan `apps/*` dan `packages/*`.
- [ ] 2. Konfigurasi `turbo.json` dengan pipeline: `build`, `dev`, `lint`, `check`, `test`.
- [ ] 3. Buat shared package `packages/tsconfig` dengan konfigurasi TypeScript `base.json` dan `package.json`.
- [ ] 4. Pindahkan starter SvelteKit yang ada saat ini ke `apps/web` atau backup komponen yang berguna, dan perbarui root `package.json`.
- [ ] 5. Jalankan `pnpm install` dan pastikan workspace terbaca dengan benar.
- [ ] 6. Commit: `chore: scaffold monorepo workspace structure with pnpm and turbo`.

---

### Task 2: Setup `@katauser/shared` (Schemas, Types, & Constants)

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/schemas/workspace.ts`
- Create: `packages/shared/src/constants/roles.ts`
- Test: `packages/shared/tests/schemas.test.ts`

**Steps:**
- [ ] 1. Buat test failing di `packages/shared/tests/schemas.test.ts` untuk validasi Zod schema workspace (slug regex, name validation).
- [ ] 2. Setup `packages/shared` dengan TypeScript build / exports.
- [ ] 3. Implementasikan schema Zod `createWorkspaceSchema`, `updateWorkspaceSchema`, dan tipe-tipe role (`WorkspaceRole`).
- [ ] 4. Jalankan test `pnpm --filter @katauser/shared test` hingga pass.
- [ ] 5. Commit: `feat(shared): add core validation schemas and types`.

---

### Task 3: Setup `@katauser/db` (PostgreSQL + Drizzle Schema + pgvector)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema/workspaces.ts`
- Create: `packages/db/src/schema/auth.ts`
- Create: `packages/db/src/schema/feedback.ts`
- Create: `packages/db/src/schema/ai.ts` (pgvector)
- Test: `packages/db/tests/schema.test.ts`

**Steps:**
- [ ] 1. Tulis test unit untuk memeriksa definisi relasi dan skema Drizzle di `packages/db/tests/schema.test.ts`.
- [ ] 2. Pasang dependensi `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`.
- [ ] 3. Implementasikan skema `workspaces`, `workspace_members`, `users`, `boards`, `posts`, dan `knowledge_embeddings` (vector).
- [ ] 4. Buat script helper client di `src/index.ts` yang mengekspor instance `db` bertipe Drizzle.
- [ ] 5. Jalankan `pnpm --filter @katauser/db test` dan uji ekspor schema.
- [ ] 6. Commit: `feat(db): implement drizzle orm schemas with multi-tenancy and pgvector`.

---

### Task 4: Setup `apps/api` (Hono Server & Typed RPC Router)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/modules/health/health.route.ts`
- Create: `apps/api/src/modules/workspaces/workspaces.route.ts`
- Test: `apps/api/tests/app.test.ts`

**Steps:**
- [ ] 1. Buat test failing di `apps/api/tests/app.test.ts` yang menguji endpoint `GET /api/v1/health` dan `GET /api/v1/workspaces`.
- [ ] 2. Setup `apps/api` dengan dependensi `hono`, `@hono/node-server`, `@hono/zod-validator`, `@katauser/db`, `@katauser/shared`.
- [ ] 3. Implementasikan route modular di `src/modules/health/` dan `src/modules/workspaces/`.
- [ ] 4. Rangkai route di `src/app.ts` dan ekspor `export type AppType = typeof app;`.
- [ ] 5. Jalankan test `pnpm --filter @katauser/api test` hingga pass.
- [ ] 6. Commit: `feat(api): scaffold hono api server with health and workspaces rpc routes`.

---

### Task 5: Setup `apps/web` (SvelteKit 2 + Svelte 5 + Hono RPC Client)

**Files:**
- Create/Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/api.ts` (hc<AppType> factory)
- Modify: `apps/web/src/routes/+page.server.ts`
- Modify: `apps/web/src/routes/+page.svelte`
- Test: `apps/web/tests/api-client.test.ts`

**Steps:**
- [ ] 1. Tulis test unit di `apps/web/tests/api-client.test.ts` untuk memverifikasi instansiasi `createApiClient` dan penanganan header token.
- [ ] 2. Hubungkan dependency `@katauser/api` dan `@katauser/shared` ke `apps/web/package.json`.
- [ ] 3. Buat helper `createApiClient` di `apps/web/src/lib/api.ts` yang menggunakan `hc<AppType>`.
- [ ] 4. Implementasikan `+page.server.ts` yang memanggil `api.health.$get()` dan merendernya di `+page.svelte` menggunakan Svelte 5 syntax.
- [ ] 5. Jalankan `pnpm build` dari root via Turbo untuk memverifikasi build type-check menyeluruh (shared -> db -> api -> web).
- [ ] 6. Commit: `feat(web): integrate sveltekit with hono rpc client and svelte 5`.

---

### Task 6: Verifikasi End-to-End Build & Dev Pipeline

**Files:**
- Create: `docker/docker-compose.dev.yml` (PostgreSQL + pgvector & Redis untuk local dev)
- Create: `README.md` (Dokumentasi monorepo & cara menjalankan dev server)

**Steps:**
- [ ] 1. Buat `docker-compose.dev.yml` untuk menjalankan PostgreSQL dengan `pgvector` dan Redis di port lokal.
- [ ] 2. Jalankan `pnpm check` dan `pnpm test` di seluruh workspace via Turbo (`turbo run check test`).
- [ ] 3. Uji jalannya perintah `pnpm dev` secara paralel untuk `api` dan `web`.
- [ ] 4. Tulis instruksi setup developer di `README.md`.
- [ ] 5. Commit: `chore: add local dev docker-compose and verify monorepo pipeline`.

