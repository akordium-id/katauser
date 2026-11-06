# Katauser Phase 3: Public Roadmap & Changelog with Auto-Notifications Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fitur Public Roadmap (Kanban board 3 kolom: Planned, In Progress, Completed), Public Changelog (timeline rilis dengan badge fitur yang terselesaikan), Admin Changelog Publisher yang menautkan changelog ke post feedback, dan sistem identifikasi voter untuk auto-notifikasi email.

**Architecture:**

- `@katauser/shared`: Zod schemas untuk Changelog & Roadmap queries.
- `packages/db`: Repository queries untuk grouping status roadmap, pembuatan release changelog, link `changelog_posts`, dan lookup voter email.
- `apps/api`: Hono RPC endpoints (`/api/v1/workspaces/:slug/roadmap`, `/api/v1/workspaces/:slug/changelogs`) dan mock/event dispatcher untuk notifikasi.
- `apps/web`: Halaman Public Roadmap (`/roadmap/[workspaceSlug]`), Public Changelog Timeline (`/changelog/[workspaceSlug]`), dan Admin Publisher (`/dashboard/[workspaceSlug]/changelog/new`).

**Tech Stack:** SvelteKit 2 (Svelte 5 Runes), Tailwind CSS v4, Hono v4, Drizzle ORM, PostgreSQL 16, Zod, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md`](file:///home/orin/code/archive/katauser-app/docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md)

---

## Global Constraints

- Kontrak API type-safe via `AppType` Hono RPC (`hc<AppType>`).
- Database multi-tenancy: seluruh query roadmap dan changelog wajib memfilter berdasarkan `workspace_id`.
- SvelteKit UI menggunakan Svelte 5 runes (`$state`, `$derived`, `$props`).
- Changelog rilis mendukung penautan ke multiple post feedback (`postIds`).

---

## Review Focus

1. **Kanban Grouping Performance**: Query roadmap harus mengelompokkan post secara efisien tanpa N+1 queries.
2. **Linked Posts Integrity**: Relasi M-to-N antara changelog dan posts harus ditangani dengan benar via tabel perantara `changelog_posts`.
3. **Voter Notification Deduplication**: Jika seorang user mem-vote 2 post berbeda yang dirilis dalam 1 changelog yang sama, user tersebut hanya boleh menerima 1 email notifikasi (deduplikasi email).
4. **Draft vs Published Changelog**: Changelog yang belum dipublikasikan (`publishedAt == null`) tidak boleh tampil di portal publik.

---

## Implementation Tasks

### Task 1: Setup Zod Schemas & Types untuk Roadmap & Changelog di `@katauser/shared`

**Files:**

- Create: `packages/shared/src/schemas/changelog.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/changelog-schemas.test.ts`

**Steps:**

- [ ] 1. Tulis test failing di `packages/shared/tests/changelog-schemas.test.ts` untuk validasi `createChangelogSchema` dan slug formatting.
- [ ] 2. Implementasikan schema Zod `createChangelogSchema`, `updateChangelogSchema`, dan types.
- [ ] 3. Ekspor schema dari `packages/shared/src/index.ts`.
- [ ] 4. Jalankan `pnpm --filter @katauser/shared test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(shared): add changelog and roadmap validation schemas`.

---

### Task 2: Service/Repository Layer untuk Roadmap & Changelog di `packages/db`

**Files:**

- Create: `packages/db/src/repositories/changelog.ts`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/tests/changelog-repo.test.ts`

**Steps:**

- [ ] 1. Tulis test failing di `packages/db/tests/changelog-repo.test.ts` yang menguji operasi create changelog, linking post, dan query roadmap grouping.
- [ ] 2. Implementasikan `ChangelogRepository` di `packages/db/src/repositories/changelog.ts`:
  - `createChangelog(params: { workspaceId, title, slug, content, publishedAt, postIds? })`
  - `getPublishedChangelogs(workspaceId)`
  - `getRoadmapGroupedPosts(workspaceId)` (mengembalikan `{ planned: [], inProgress: [], completed: [] }`)
  - `getVoterEmailsForPosts(postIds: string[])` (mengembalikan unique emails voter untuk notifikasi)
- [ ] 3. Jalankan `pnpm --filter @katauser/db test` hingga pass.
- [ ] 4. Commit: `feat(db): implement changelog and roadmap repository queries`.

---

### Task 3: Hono Roadmap & Changelog RPC Endpoints di `apps/api`

**Files:**

- Create: `apps/api/src/modules/roadmap/roadmap.route.ts`
- Create: `apps/api/src/modules/changelog/changelog.route.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/roadmap-changelog.test.ts`

**Steps:**

- [ ] 1. Tulis test failing di `apps/api/tests/roadmap-changelog.test.ts` untuk endpoint `GET /workspaces/:slug/roadmap`, `GET /workspaces/:slug/changelogs`, dan `POST /workspaces/:slug/changelogs`.
- [ ] 2. Implementasikan route modular `roadmapRoute` dan `changelogRoute`.
- [ ] 3. Rangkai route ke `apps/api/src/app.ts` sehingga `AppType` ter-update secara otomatis.
- [ ] 4. Jalankan `pnpm --filter @katauser/api test` hingga pass.
- [ ] 5. Commit: `feat(api): implement roadmap and changelog rpc endpoints`.

---

### Task 4: SvelteKit Public Roadmap Kanban Portal (`apps/web`)

**Files:**

- Create: `apps/web/src/routes/(public)/roadmap/[workspaceSlug]/+page.server.ts`
- Create: `apps/web/src/routes/(public)/roadmap/[workspaceSlug]/+page.svelte`
- Create: `apps/web/src/lib/components/roadmap/KanbanColumn.svelte`
- Test: `apps/web/tests/roadmap-ui.test.ts`

**Steps:**

- [ ] 1. Tulis test unit di `apps/web/tests/roadmap-ui.test.ts` untuk helper pengelompokan roadmap.
- [ ] 2. Buat komponen Svelte 5 `KanbanColumn.svelte`.
- [ ] 3. Buat SSR loader di `+page.server.ts` yang memanggil `api.workspaces[':slug'].roadmap.$get()` via Hono RPC Client.
- [ ] 4. Rancang tampilan halaman Public Roadmap Kanban 3 kolom (Planned, In Progress, Completed).
- [ ] 5. Jalankan `pnpm --filter @katauser/web test check` hingga lolos.
- [ ] 6. Commit: `feat(web): add public roadmap kanban portal`.

---

### Task 5: SvelteKit Public Changelog & Admin Publisher (`apps/web`)

**Files:**

- Create: `apps/web/src/routes/(public)/changelog/[workspaceSlug]/+page.server.ts`
- Create: `apps/web/src/routes/(public)/changelog/[workspaceSlug]/+page.svelte`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/changelog/new/+page.server.ts`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/changelog/new/+page.svelte`

**Steps:**

- [ ] 1. Buat halaman public changelog timeline (`/changelog/[workspaceSlug]`) dengan badge fitur yang dirilis.
- [ ] 2. Buat halaman admin changelog publisher (`/dashboard/[workspaceSlug]/changelog/new`) untuk menulis release note dan memilih post yang diselesaikan.
- [ ] 3. Jalankan full type check dan test suite di seluruh monorepo (`turbo run check test`).
- [ ] 4. Jalankan full production build (`turbo run build`).
- [ ] 5. Commit: `feat(web): add public changelog timeline and admin publisher`.
