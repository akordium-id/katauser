# Katauser Phase 6: Custom Domain & Production Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan dukungan Custom Domain multi-tenant dengan transparent rewrite di SvelteKit hooks, endpoint verifikasi DNS CNAME di Hono, trusted proxy rate limiting untuk mitigasi spam bot di Coolify/Docker, halaman kelola domain di Admin dashboard, dan Dockerfile produksi multi-stage.

**Architecture:**
- `@katauser/shared`: Zod schema `domainVerifySchema`, helper DNS & domain validator.
- `apps/api`: Route `GET /api/v1/domains/verify`, middleware sliding-window rate limiter dengan trusted proxy IP extraction (`cf-connecting-ip`, `x-forwarded-for`).
- `apps/web`:
  - `src/hooks.server.ts`: Transparent custom domain router (rewriting request host ke portal publik tenant).
  - Admin domain settings portal: `/dashboard/[workspaceSlug]/settings/domain` dengan status verifikasi CNAME langsung.
- Infra: Multi-stage `docker/Dockerfile.api` dan `docker/Dockerfile.web` siap deploy ke Coolify / VPS.

**Tech Stack:** SvelteKit 2 (Svelte 5 Runes), Hono v4, Tailwind CSS v4, Node.js DNS resolver, Docker multi-stage.

---

## Global Constraints

- Custom domain routing harus transparan bagi pengunjung (tidak mengubah URL di address bar browser).
- Rate limiting harus membaca IP asli pengunjung melalui trusted proxy headers dari Traefik / Cloudflare / Coolify.
- Dockerfile harus multi-stage, menjalankan proses sebagai non-root user, dan efisien dalam layer caching.

---

## Implementation Tasks

### Task 1: Domain Validation & CNAME Verification Schemas di `@katauser/shared`
**Files:**
- Create: `packages/shared/src/schemas/domain.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/domain-schemas.test.ts`

**Steps:**
- [ ] 1. Tulis failing test di `packages/shared/tests/domain-schemas.test.ts` untuk validasi hostname custom domain dan helper sanitasi domain.
- [ ] 2. Implementasikan `domainVerifySchema` dan helper di `packages/shared/src/schemas/domain.ts`.
- [ ] 3. Ekspor dari `packages/shared/src/index.ts`.
- [ ] 4. Jalankan `pnpm --filter @katauser/shared test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(shared): add domain validation schemas and helpers`.

---

### Task 2: Hono DNS CNAME Verification & Trusted Proxy Rate Limiter di `apps/api`
**Files:**
- Create: `apps/api/src/modules/domains/domains.route.ts`
- Create: `apps/api/src/middleware/rate-limiter.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/domains-ratelimit.test.ts`

**Steps:**
- [ ] 1. Tulis failing test di `apps/api/tests/domains-ratelimit.test.ts` untuk verifikasi CNAME dan rate limiter vote/post.
- [ ] 2. Implementasikan `domainsRoute` dengan DNS CNAME resolution mock/real.
- [ ] 3. Implementasikan `createRateLimiter` middleware dengan trusted proxy header extraction.
- [ ] 4. Pasang route dan middleware di `apps/api/src/app.ts`.
- [ ] 5. Jalankan `pnpm --filter @katauser/api test` hingga pass (GREEN).
- [ ] 6. Commit: `feat(api): implement domain cname verification and trusted proxy rate limiter`.

---

### Task 3: SvelteKit Transparent Custom Domain Routing Hook di `apps/web`
**Files:**
- Create: `apps/web/src/lib/domain-router.ts`
- Modify: `apps/web/src/hooks.server.ts`
- Test: `apps/web/tests/domain-router.test.ts`

**Steps:**
- [ ] 1. Tulis failing test di `apps/web/tests/domain-router.test.ts` untuk resolving domain host ke workspace slug dan path rewriting.
- [ ] 2. Implementasikan helper router `resolveCustomDomain` dan `rewritePathForCustomDomain`.
- [ ] 3. Integrasikan ke `apps/web/src/hooks.server.ts`.
- [ ] 4. Jalankan `pnpm --filter @katauser/web test tests/domain-router.test.ts` hingga pass (GREEN).
- [ ] 5. Commit: `feat(web): add transparent custom domain routing in server hooks`.

---

### Task 4: Admin Custom Domain Management Portal di `apps/web`
**Files:**
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/domain/+page.server.ts`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/domain/+page.svelte`
- Test: `apps/web/tests/domain-ui.test.ts`

**Steps:**
- [ ] 1. Tulis failing test di `apps/web/tests/domain-ui.test.ts` untuk helper status DNS CNAME.
- [ ] 2. Buat SSR loader di `+page.server.ts` dan antarmuka manajemen domain dengan indikator status CNAME real-time di `+page.svelte`.
- [ ] 3. Tambahkan panduan konfigurasi DNS untuk penyedia domain populer (Cloudflare, GoDaddy, Niagahoster).
- [ ] 4. Jalankan `pnpm --filter @katauser/web test check` hingga lolos.
- [ ] 5. Commit: `feat(web): add admin custom domain management portal`.

---

### Task 5: Production Dockerfiles & Monorepo Hardening
**Files:**
- Create: `docker/Dockerfile.api`
- Create: `docker/Dockerfile.web`
- Modify: `docker/docker-compose.prod.yml`
- Test: Full monorepo verification (`turbo run check test build`).

**Steps:**
- [ ] 1. Buat multi-stage `docker/Dockerfile.api` (Hono API lightweight Node alpine image dengan non-root user).
- [ ] 2. Buat multi-stage `docker/Dockerfile.web` (SvelteKit SSR Node adapter image).
- [ ] 3. Buat `docker/docker-compose.prod.yml` untuk deployment Coolify/Docker.
- [ ] 4. Jalankan full type check dan test suite di seluruh monorepo (`turbo run check test`).
- [ ] 5. Jalankan full production build (`turbo run build`).
- [ ] 6. Commit: `feat(infra): add production multi-stage dockerfiles and compose configuration`.

