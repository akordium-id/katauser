# Katauser Phase 5: Live Chat & AI Agent Juno Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun sistem Live Chat interaktif dengan AI Agent Juno berbasis Server-Sent Events (SSE) streaming, pencarian RAG context di pgvector (`knowledge_embeddings`), deteksi eskalasi otomatis ke tim support (Human Handoff), dan dashboard Admin Inbox di `apps/web`.

**Architecture:**

- `@katauser/shared`: Zod schemas untuk conversation, message, dan escalation.
- `packages/db`: Tabel `conversations` & `messages`, `ChatRepository`, dan pgvector knowledge similarity matching.
- `apps/api`: Hono SSE streaming route (`/api/v1/chat/conversations/:id/juno-stream`), message posting, dan escalation endpoint.
- `packages/widget`: Update `MessagesTab.svelte` dengan real-time SSE streaming reader dan human handoff status.
- `apps/web`: Admin Live Chat Inbox (`/dashboard/[workspaceSlug]/inbox`) untuk monitoring percakapan dan balasan dari tim support.

**Tech Stack:** Svelte 5 (Runes), Tailwind CSS v4, Hono v4 (c.streamText), Drizzle ORM, PostgreSQL 16 + pgvector, Vitest.

---

## Global Constraints

- Real-time transport menggunakan SSE streaming (`text/event-stream`) + HTTP POST untuk ketahanan proxy di Coolify/Docker.
- AI Agent Juno mendukung Human Handoff jika pertanyaan butuh manusia atau pengguna meminta eskalasi (`assigned_to: 'human'`).
- Svelte 5 reactive runes (`$state`, `$derived`, `$props`).
- Multi-tenant isolation: seluruh query percakapan dan pesan wajib memfilter berdasarkan `workspace_id`.

---

## Implementation Tasks

### Task 1: Chat & Conversation Zod Schemas di `@katauser/shared`

**Files:**

- Create: `packages/shared/src/schemas/chat.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/chat-schemas.test.ts`

**Steps:**

- [ ] 1. Tulis failing test di `packages/shared/tests/chat-schemas.test.ts` untuk `createConversationSchema`, `sendMessageSchema`, dan `escalateConversationSchema`.
- [ ] 2. Implementasikan schema Zod dan types di `packages/shared/src/schemas/chat.ts`.
- [ ] 3. Ekspor dari `packages/shared/src/index.ts`.
- [ ] 4. Jalankan `pnpm --filter @katauser/shared test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(shared): add chat and conversation validation schemas`.

---

### Task 2: Database Schema & Chat / Juno Repository Layer di `packages/db`

**Files:**

- Create: `packages/db/src/schema/chat.ts`
- Create: `packages/db/src/repositories/chat.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/tests/chat-repo.test.ts`

**Steps:**

- [ ] 1. Tulis failing test di `packages/db/tests/chat-repo.test.ts` untuk pembuatan percakapan, penyimpanan pesan, retrieval thread, dan eskalasi ke human.
- [ ] 2. Definisikan tabel Drizzle `conversations` dan `messages` di `packages/db/src/schema/chat.ts`.
- [ ] 3. Implementasikan `ChatRepository` di `packages/db/src/repositories/chat.ts`.
- [ ] 4. Jalankan `pnpm --filter @katauser/db test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(db): add chat schema and repository layer`.

---

### Task 3: Hono Live Chat & Juno AI Agent SSE Route di `apps/api`

**Files:**

- Create: `apps/api/src/modules/chat/chat.route.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/chat-juno.test.ts`

**Steps:**

- [ ] 1. Tulis failing test di `apps/api/tests/chat-juno.test.ts` untuk endpoint percakapan, pengiriman pesan, dan escalation.
- [ ] 2. Implementasikan route modular `chatRoute` dengan dukungan SSE streaming response AI Juno (`c.streamText`).
- [ ] 3. Rangkai route ke `apps/api/src/app.ts` dengan update otomatis `AppType`.
- [ ] 4. Jalankan `pnpm --filter @katauser/api test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(api): implement live chat endpoints and juno ai sse streaming`.

---

### Task 4: Interactive Live Chat & Juno Streaming di `@katauser/widget`

**Files:**

- Modify: `packages/widget/src/components/tabs/MessagesTab.svelte`
- Test: `packages/widget/tests/chat-tab.test.ts`

**Steps:**

- [ ] 1. Tulis failing test di `packages/widget/tests/chat-tab.test.ts` untuk state chat dan message formatting.
- [ ] 2. Implementasikan SSE reader & live message composer di `MessagesTab.svelte`.
- [ ] 3. Tambahkan indikator status eskalasi (human handoff banner).
- [ ] 4. Uji build `@katauser/widget` (`pnpm --filter @katauser/widget build`).
- [ ] 5. Commit: `feat(widget): implement sse streaming chat and human handoff in messages tab`.

---

### Task 5: Admin Live Chat & Inbox di `apps/web`

**Files:**

- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/inbox/+page.server.ts`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/inbox/+page.svelte`
- Test: `apps/web/tests/inbox-ui.test.ts`

**Steps:**

- [ ] 1. Tulis failing test di `apps/web/tests/inbox-ui.test.ts` untuk helper inbox (status badge, sender format).
- [ ] 2. Buat SSR loader di `+page.server.ts` dan antarmuka split view 2 kolom (thread list & message view/reply) di `+page.svelte`.
- [ ] 3. Jalankan full type check dan test suite di seluruh monorepo (`turbo run check test`).
- [ ] 4. Jalankan full production build (`turbo run build`).
- [ ] 5. Commit: `feat(web): add admin live chat inbox portal`.
