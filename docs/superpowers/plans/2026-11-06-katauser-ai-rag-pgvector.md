# Katauser Deep AI & RAG Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun AI & RAG Engine untuk Katauser: Website docs ingestion, pgvector cosine similarity search, real-time semantic duplicate post detection, dan RAG-augmented SSE streaming response untuk AI Agent Juno ala UserJot.

**Architecture:**
- Multi-provider 1536-dim vector embedding generator (OpenAI text-embedding-3-small dengan deterministic normalized mock fallback untuk test offline).
- Cosine similarity matching engine untuk mendeteksi ide masukan serupa (`POST /boards/:boardId/posts/similar`).
- Workspace knowledge base repository untuk chunking dan embedding artikel/FAQ.
- RAG context injection ke SSE stream live chat Juno.
- SvelteKit Admin AI Knowledge Base Portal.

**Tech Stack:** Hono, SvelteKit, TypeScript, Zod, pgvector / Cosine similarity, Vitest.

---

### Task 1: Embedding & Cosine Similarity Engine
**Files:**
- Create: `packages/shared/src/schemas/ai.ts`
- Modify: `packages/shared/src/index.ts`
- Create: `apps/api/src/services/ai-embeddings.ts`
- Create: `apps/api/tests/ai-embeddings.test.ts`

- [ ] Tulis unit test untuk chunking teks, embedding normalization, cosine similarity math, dan OpenAI/mock fallback.
- [ ] Implementasikan schema AI Zod di `@katauser/shared`.
- [ ] Implementasikan `generateEmbedding`, `cosineSimilarity`, dan `chunkText` di `apps/api/src/services/ai-embeddings.ts`.
- [ ] Jalankan vitest hingga passing 100%.

### Task 2: Knowledge Ingestion API (Website Docs & FAQ Ingestion)
**Files:**
- Create: `apps/api/src/modules/ai/knowledge.route.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/tests/knowledge-ingest.test.ts`

- [ ] Tulis integration test untuk endpoint ingest dokumen, list knowledge base, dan semantic search.
- [ ] Implementasikan `knowledgeRoute` dengan chunking dan embedding storage.
- [ ] Daftarkan `knowledgeRoute` di `apps/api/src/app.ts`.
- [ ] Jalankan vitest hingga passing 100%.

### Task 3: Semantic Duplicate Detection di Feedback Posts
**Files:**
- Modify: `apps/api/src/modules/feedback/posts.route.ts`
- Create: `apps/api/tests/posts-similarity.test.ts`

- [ ] Tulis test untuk endpoint `POST /boards/:boardId/posts/similar` yang mengembalikan ide serupa jika cosine similarity > 0.70.
- [ ] Update `posts.route.ts` untuk generate embedding pada post baru dan menyediakan endpoint similarity query.
- [ ] Jalankan vitest hingga passing 100%.

### Task 4: RAG Augmented Context pada SSE Live Chat Juno
**Files:**
- Modify: `apps/api/src/modules/chat/chat.route.ts`
- Create: `apps/api/tests/chat-rag-juno.test.ts`

- [ ] Tulis test untuk memverifikasi AI Juno SSE stream merespon dengan memanfaatkan konteks dokumen yang relevan dari knowledge base.
- [ ] Hubungkan `chat.route.ts` dengan semantic similarity search knowledge base untuk memperkaya prompt Juno.
- [ ] Jalankan vitest hingga passing 100%.

### Task 5: Admin UI Knowledge Base & Duplicate Suggestion Helpers
**Files:**
- Create: `apps/web/src/lib/ai-helpers.ts`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/ai/+page.svelte`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/ai/+page.server.ts`
- Create: `apps/web/tests/ai-ui.test.ts`

- [ ] Tulis test untuk helper AI (persentase kecocokan, preview snippet).
- [ ] Buat Admin UI Knowledge Base untuk input URL / teks FAQ panduan produk Juno.
- [ ] Jalankan vitest dan `svelte-check` di `apps/web` hingga passing 100%.

