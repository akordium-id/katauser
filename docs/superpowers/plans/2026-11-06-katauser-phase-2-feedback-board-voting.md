# Katauser Phase 2: Feedback Board & Voting Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul Feedback Board dan Voting Loop: CRUD board, submit feedback post, voting (upvote toggle) dengan counter atomic, comment thread, perubahan status post, serta tampilan UI Public Portal dan Admin Dashboard di SvelteKit terhubung via Hono RPC.

**Architecture:** 
- `@katauser/shared`: Zod schemas & type definitions untuk Board, Post, Vote, dan Comment.
- `packages/db`: Drizzle queries untuk Board, Post, Vote, dan Comment dengan atomic vote transaction.
- `apps/api`: Modular Hono routes (`/api/v1/boards`, `/api/v1/posts`) di-chaining ke `AppType`.
- `apps/web`: SvelteKit SSR Public Portal (`/b/[workspaceSlug]/[boardSlug]`) dengan upvote instan dan Admin Management (`/dashboard/workspaces/[slug]/boards`).

**Tech Stack:** SvelteKit 2 (Svelte 5 Runes), Tailwind CSS v4, Hono v4, Drizzle ORM, PostgreSQL 16, Zod, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md`](file:///home/orin/code/archive/katauser-app/docs/superpowers/specs/2026-11-05-katauser-monorepo-design.md)

---

## Global Constraints

- Semua interaksi client-server melalui Hono RPC (`hc<AppType>`).
- Database multi-tenancy: setiap query board, post, vote, dan comment wajib memvalidasi `workspace_id`.
- Toggle vote harus atomic (mencegah desinkronisasi `votes_count` pada post saat traffic tinggi).
- Frontend SvelteKit menggunakan Svelte 5 runes (`$state`, `$derived`, `$props`).

---

## Review Focus

1. **Race Condition pada Voting**: Jika 2 request vote datang bersamaan, `votes_count` harus konsisten dengan jumlah row sebenarnya di tabel `votes`.
2. **Duplicate Vote Prevention**: Pengguna (end-user atau team member) hanya boleh mem-vote 1 kali per post; vote kedua menghapus vote (toggle un-vote).
3. **Public vs Private Board Access**: Board dengan `is_private = true` tidak boleh diakses oleh visitor anonim tanpa otentikasi.
4. **Input Sanitization**: Konten markdown/HTML di post dan comment harus divalidasi panjang dan karakternya via Zod.
5. **SEO & SSR**: Halaman public board `/b/[workspaceSlug]/[boardSlug]` harus di-render di server (`+page.server.ts`) untuk performa dan SEO yang optimal.

---

## Implementation Tasks

### Task 1: Setup Zod Schemas & Types untuk Feedback di `@katauser/shared`

**Files:**
- Create: `packages/shared/src/schemas/feedback.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/feedback-schemas.test.ts`

**Steps:**
- [ ] 1. Tulis test failing di `packages/shared/tests/feedback-schemas.test.ts` untuk validasi `createBoardSchema`, `createPostSchema`, `votePostSchema`, `createCommentSchema`, dan `updatePostStatusSchema`.
- [ ] 2. Implementasikan Zod schema di `packages/shared/src/schemas/feedback.ts` dengan status post valid: `pending`, `under_review`, `planned`, `in_progress`, `completed`, `closed`.
- [ ] 3. Ekspor schema dari `packages/shared/src/index.ts`.
- [ ] 4. Jalankan `pnpm --filter @katauser/shared test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(shared): add feedback board and post validation schemas`.

---

### Task 2: Service/Repository Layer untuk Feedback di `packages/db`

**Files:**
- Create: `packages/db/src/repositories/feedback.ts`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/tests/feedback-repo.test.ts`

**Steps:**
- [ ] 1. Tulis test failing di `packages/db/tests/feedback-repo.test.ts` yang menguji operasi create board, create post, toggle vote (atomic count), dan create comment.
- [ ] 2. Implementasikan fungsi query di `packages/db/src/repositories/feedback.ts` menggunakan Drizzle ORM:
  - `createBoard`, `getBoardsByWorkspace`
  - `createPost`, `getPostsByBoard` (mendukung sorting: `top_voted`, `newest`, dan filter `status`)
  - `toggleVote` (transaction: check existing -> delete vote / insert vote -> update `posts.votes_count`)
  - `createComment`, `getCommentsByPost`
- [ ] 3. Jalankan `pnpm --filter @katauser/db test` hingga pass.
- [ ] 4. Commit: `feat(db): implement feedback repository queries and atomic vote handling`.

---

### Task 3: Hono Feedback Modules & RPC Routes di `apps/api`

**Files:**
- Create: `apps/api/src/modules/feedback/boards.route.ts`
- Create: `apps/api/src/modules/feedback/posts.route.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/feedback.test.ts`

**Steps:**
- [ ] 1. Tulis test failing di `apps/api/tests/feedback.test.ts` yang menguji endpoint boards, post creation, upvote toggle, dan comment.
- [ ] 2. Implementasikan handler modular:
  - `boardsRoute`: `GET /workspaces/:slug/boards`, `POST /workspaces/:slug/boards`
  - `postsRoute`: `GET /boards/:boardId/posts`, `POST /boards/:boardId/posts`, `POST /posts/:postId/vote`, `GET /posts/:postId/comments`, `POST /posts/:postId/comments`, `PATCH /posts/:postId/status`
- [ ] 3. Rangkai route ke `apps/api/src/app.ts` sehingga `AppType` ter-update secara otomatis.
- [ ] 4. Jalankan `pnpm --filter @katauser/api test` hingga pass.
- [ ] 5. Commit: `feat(api): implement feedback boards, posts, voting, and comments rpc endpoints`.

---

### Task 4: SvelteKit Public Feedback Board UI (`apps/web`)

**Files:**
- Create: `apps/web/src/routes/(public)/b/[workspaceSlug]/[boardSlug]/+page.server.ts`
- Create: `apps/web/src/routes/(public)/b/[workspaceSlug]/[boardSlug]/+page.svelte`
- Create: `apps/web/src/routes/(public)/b/[workspaceSlug]/[boardSlug]/[postId]/+page.server.ts`
- Create: `apps/web/src/routes/(public)/b/[workspaceSlug]/[boardSlug]/[postId]/+page.svelte`
- Create: `apps/web/src/lib/components/feedback/PostCard.svelte`
- Create: `apps/web/src/lib/components/feedback/VoteButton.svelte`
- Create: `apps/web/src/lib/components/feedback/CreatePostModal.svelte`
- Test: `apps/web/tests/feedback-ui.test.ts`

**Steps:**
- [ ] 1. Tulis test unit di `apps/web/tests/feedback-ui.test.ts` untuk memverifikasi fungsionalitas rendering PostCard dan VoteButton.
- [ ] 2. Buat komponen reaktif Svelte 5: `PostCard.svelte`, `VoteButton.svelte`, `CreatePostModal.svelte`.
- [ ] 3. Buat SSR loader di `+page.server.ts` yang memanggil `api.boards.posts.$get()` via Hono RPC Client.
- [ ] 4. Rancang tampilan halaman public board modern & clean ala UserJot (list posts, filter status, sort top/newest, modal submit post).
- [ ] 5. Jalankan `pnpm --filter @katauser/web test check` hingga lolos.
- [ ] 6. Commit: `feat(web): add public feedback board portal and voting components`.

---

### Task 5: Admin Dashboard Feedback Management & Pipeline Verification

**Files:**
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/+page.server.ts`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/+page.svelte`
- Modify: `README.md`

**Steps:**
- [ ] 1. Implementasikan halaman admin board management untuk membuat board baru dan mengubah status post feedback (`Planned`, `In Progress`, `Completed`).
- [ ] 2. Jalankan full type check dan test suite di seluruh monorepo (`turbo run check test`).
- [ ] 3. Jalankan full production build (`turbo run build`).
- [ ] 4. Commit: `feat(web): add admin feedback management dashboard and verify monorepo pipeline`.

