# Chat-to-Feedback Bridge di Juno AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghubungkan modul live chat AI Juno dengan feedback boards dan roadmap di Katauser, memungkinkan asisten AI mendeteksi ide fitur di pesan chat, merekomendasikan post serupa untuk 1-click upvote (`similarityScore >= 0.70`), atau menawarkan pendaftaran post feedback baru (`similarityScore < 0.70`) secara langsung di dalam gelembung obrolan widget.

**Architecture:** Menggunakan format *Single Stream Response with Structured SSE Action Card*. Backend Hono API melakukan deteksi intent feedback dan kalkulasi cosine similarity terhadap post aktif di workspace. Sebelum mengirim terminator `[DONE]`, backend mengalirkan chunk kartu aksi terstruktur (`action: { type, ... }`) yang ditangkap oleh frontend Svelte widget (`MessagesTab.svelte`) untuk merender kartu interaktif (inline email capture untuk guest, atau 1-klik untuk identified user) yang mengeksekusi upvote atau pembuatan post baru tanpa berpindah tab.

**Tech Stack:** Hono v4 (SSE streaming), Svelte 5 (Widget Web Component), `@katauser/shared` (Zod & TypeScript contracts), `ai-embeddings` (1536-dim deterministic & OpenAI/pgvector embeddings), Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-23-chat-to-feedback-bridge-design.md`](file:///home/orin/code/archive/katauser-app/docs/superpowers/specs/2026-11-23-chat-to-feedback-bridge-design.md)

## Global Constraints

- Monorepo pnpm + Turborepo dengan strict TypeScript check (`turbo run check`).
- Decoupled contracts di `@katauser/shared` sebagai single source of truth tipe payload.
- Zero breaking changes pada endpoint `/chat/conversations/:id/juno-stream` untuk client yang hanya membaca teks biasa.
- Validasi email wajib pada mode Guest sebelum memanggil API upvote/post creation.
- 100% test passing di Vitest di semua package yang disentuh.

## Review Focus

- Postingan yang berstatus `closed` atau `merged` tidak boleh direkomendasikan sebagai post serupa.
- Pesan chat yang menanyakan hal umum atau dokumentasi (RAG biasa) tidak boleh memicu kartu feedback sembarangan.
- Upvote dari pengguna guest dengan email yang tidak valid harus ditolak dengan validasi sisi client sebelum hit API.
- Eksekusi aksi yang berulang (double click) harus dicegah dengan flag loading dan `actionResolved = true`.
- Workspace tenant boundary: Juno hanya boleh mencari dan membuat post di dalam workspace yang sesuai dengan sesi percakapan.

---

### Task 1: Shared Data Contracts & Schemas (`@katauser/shared`)

**Files:**
- Modify: `packages/shared/src/schemas/chat.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/chat-schemas.test.ts`

**Interfaces:**
- Consumes: Existing chat schemas (`createConversationSchema`, `sendMessageSchema`).
- Produces: `JunoActionType`, `JunoSimilarPostAction`, `JunoCreateFeedbackAction`, `JunoActionPayload`, `JunoStreamChunk`, `junoActionPayloadSchema`.

- [ ] **Step 1: Write the failing test**

Create `packages/shared/tests/chat-schemas.test.ts`:
```typescript
import { describe, it, expect } from "vitest"
import {
  junoActionPayloadSchema,
  type JunoSimilarPostAction,
  type JunoCreateFeedbackAction,
  type JunoStreamChunk,
} from "../src"

describe("Juno Action Schemas", () => {
  it("validates a similar_post action payload", () => {
    const validSimilar: JunoSimilarPostAction = {
      type: "similar_post",
      post: {
        id: "post_123",
        title: "Ekspor Laporan ke CSV",
        content: "Tambahkan opsi ekspor CSV",
        votesCount: 15,
        status: "planned",
        boardSlug: "fitur",
      },
      similarityScore: 0.85,
    }

    const parsed = junoActionPayloadSchema.safeParse(validSimilar)
    expect(parsed.success).toBe(true)
  })

  it("validates a create_feedback action payload", () => {
    const validCreate: JunoCreateFeedbackAction = {
      type: "create_feedback",
      boardId: "board_abc",
      boardSlug: "fitur",
      draft: {
        title: "Integrasi WhatsApp Notifikasi",
        content: "Kirim notifikasi ke nomor WA user",
      },
    }

    const parsed = junoActionPayloadSchema.safeParse(validCreate)
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid action payload type", () => {
    const invalid = {
      type: "unknown_action",
    }
    const parsed = junoActionPayloadSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/shared test tests/chat-schemas.test.ts`  
Expected: FAIL with "junoActionPayloadSchema is not defined"

- [ ] **Step 3: Implement schemas in `packages/shared/src/schemas/chat.ts` & export in `src/index.ts`**

Tambahkan Zod schemas dan TypeScript interfaces:
```typescript
import { z } from "zod"

export const junoSimilarPostActionSchema = z.object({
  type: z.literal("similar_post"),
  post: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    content: z.string(),
    votesCount: z.number().int().nonnegative(),
    status: z.enum([
      "open",
      "under_review",
      "planned",
      "in_progress",
      "completed",
      "closed",
    ]),
    boardSlug: z.string().min(1),
  }),
  similarityScore: z.number().min(0).max(1),
})

export const junoCreateFeedbackActionSchema = z.object({
  type: z.literal("create_feedback"),
  boardId: z.string().min(1),
  boardSlug: z.string().min(1),
  draft: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
})

export const junoActionPayloadSchema = z.discriminatedUnion("type", [
  junoSimilarPostActionSchema,
  junoCreateFeedbackActionSchema,
])

export type JunoSimilarPostAction = z.infer<typeof junoSimilarPostActionSchema>
export type JunoCreateFeedbackAction = z.infer<typeof junoCreateFeedbackActionSchema>
export type JunoActionPayload = z.infer<typeof junoActionPayloadSchema>
export type JunoActionType = JunoActionPayload["type"]

export interface JunoStreamChunk {
  text?: string
  action?: JunoActionPayload
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/shared test tests/chat-schemas.test.ts`  
Expected: PASS (3 tests passed)

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/chat.ts packages/shared/src/index.ts packages/shared/tests/chat-schemas.test.ts
git commit -m "feat(shared): add Zod schemas and types for Juno action cards"
```

---

### Task 2: Backend Hono Pipeline & Intent/Similarity Routing (`apps/api`)

**Files:**
- Modify: `apps/api/src/modules/chat/chat.route.ts`
- Test: `apps/api/tests/chat-feedback-bridge.test.ts`

**Interfaces:**
- Consumes: `junoActionPayloadSchema`, `generateEmbedding`, `cosineSimilarity`, `postsStore`, `boardsStore`.
- Produces: Enhanced `POST /chat/conversations/:id/juno-stream` that emits action chunk for feedback prompts.

- [ ] **Step 1: Write the failing test**

Create `apps/api/tests/chat-feedback-bridge.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { chatRoute, conversationsStore, messagesStore } from "../src/modules/chat/chat.route"
import { postsStore } from "../src/modules/feedback/posts.route"
import { boardsStore } from "../src/modules/feedback/boards.route"

describe("Chat to Feedback Bridge (Hono API)", () => {
  beforeEach(() => {
    conversationsStore.length = 0
    messagesStore.length = 0
    postsStore.length = 0
    boardsStore.length = 0

    // Setup mock boards
    boardsStore.push({
      id: "board_feat_1",
      workspaceId: "acme",
      name: "Ide & Fitur",
      slug: "fitur",
      description: null,
      isPrivate: false,
      allowGuestPosts: true,
      createdAt: new Date().toISOString(),
    })

    // Setup conversation
    conversationsStore.push({
      id: "conv_test_1",
      workspaceId: "acme",
      status: "open",
      assignedTo: "ai_juno",
      createdAt: new Date().toISOString(),
    })
  })

  it("suggests similar_post action card when prompt closely matches an existing active post", async () => {
    // Add existing post
    postsStore.push({
      id: "p_dark_mode",
      boardId: "board_feat_1",
      title: "Mode Gelap (Dark Mode)",
      content: "Tolong sediakan tema gelap untuk menghemat baterai",
      status: "in_progress",
      votesCount: 24,
      totalMrr: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const res = await chatRoute.request("/chat/conversations/conv_test_1/juno-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Bisa tambahkan fitur dark mode malam hari?" }),
    })

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('"type":"similar_post"')
    expect(text).toContain("Mode Gelap (Dark Mode)")
    expect(text).toContain("p_dark_mode")
  })

  it("suggests create_feedback action card when prompt has feedback intent but no similar post exists", async () => {
    const res = await chatRoute.request("/chat/conversations/conv_test_1/juno-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Tolong buatkan fitur ekspor data ke format Apache Parquet" }),
    })

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('"type":"create_feedback"')
    expect(text).toContain("board_feat_1")
    expect(text).toContain("Apache Parquet")
  })

  it("does not attach action card for normal question without feedback intent", async () => {
    const res = await chatRoute.request("/chat/conversations/conv_test_1/juno-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Bagaimana cara mengganti kata sandi saya?" }),
    })

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).not.toContain('"action"')
  })

  it("ignores closed or merged posts when finding similar posts", async () => {
    postsStore.push({
      id: "p_closed_1",
      boardId: "board_feat_1",
      title: "Integrasi Slack Webhook",
      content: "Notifikasi slack",
      status: "closed",
      votesCount: 5,
      totalMrr: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const res = await chatRoute.request("/chat/conversations/conv_test_1/juno-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Bisa buatkan integrasi notifikasi ke Slack?" }),
    })

    expect(res.status).toBe(200)
    const text = await res.text()
    // Should NOT match closed post, should offer create_feedback instead
    expect(text).not.toContain("p_closed_1")
    expect(text).toContain('"type":"create_feedback"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/api test tests/chat-feedback-bridge.test.ts`  
Expected: FAIL (SSE stream does not yet emit action cards)

- [ ] **Step 3: Implement intent detection & similarity logic in `apps/api/src/modules/chat/chat.route.ts`**

1. Tambahkan fungsi helper `isFeedbackIntent(prompt: string): boolean`.
2. Import `postsStore` dari `../feedback/posts.route`, `boardsStore` dari `../feedback/boards.route`, dan `generateEmbedding`, `cosineSimilarity` dari `../../services/ai-embeddings`.
3. Pada handler `/chat/conversations/:id/juno-stream`:
   - Jika bukan human handoff dan `isFeedbackIntent(prompt)` bernilai true:
     - Cari board milik workspace dari `boardsStore` (ambil yang slug `fitur` atau board pertama).
     - Cari post aktif (`status !== 'closed' && status !== 'merged'`) pada board workspace tersebut.
     - Hitung similarity embedding `prompt` terhadap setiap post.
     - Jika skor tertinggi `>= 0.70`, susun teks respon ramah Juno dan `action = { type: "similar_post", post: {...}, similarityScore }`.
     - Jika tidak ada yang `>= 0.70`, susun draf judul singkat dan `action = { type: "create_feedback", boardId, boardSlug, draft: { title, content: prompt } }`.
   - Di dalam callback `streamSSE`:
     - Tulis chunk teks Juno.
     - Jika `action` ada, tulis chunk `data: ${JSON.stringify({ action })}\n\n`.
     - Tulis `data: [DONE]\n\n`.
   - Simpan AI message ke `messagesStore` (sertakan `action` jika ada).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/api test tests/chat-feedback-bridge.test.ts`  
Expected: PASS (4 tests passed)

- [ ] **Step 5: Run existing chat tests to ensure no regressions**

Run: `pnpm --filter @katauser/api test`  
Expected: PASS on all test files

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/chat/chat.route.ts apps/api/tests/chat-feedback-bridge.test.ts
git commit -m "feat(api): implement chat-to-feedback similarity detection and SSE action cards"
```

---

### Task 3: Widget UI & Interactive Action Cards (`packages/widget`)

**Files:**
- Modify: `packages/widget/src/chat-helpers.ts`
- Modify: `packages/widget/src/components/tabs/MessagesTab.svelte`
- Test: `packages/widget/tests/chat-feedback-bridge.test.ts`

**Interfaces:**
- Consumes: `JunoActionPayload`, `JunoSimilarPostAction`, `JunoCreateFeedbackAction`, `POST /posts/:id/vote`, `POST /boards/:id/posts`.
- Produces: Interactive action cards in `MessagesTab.svelte`, guest inline email validation, optimistic resolution.

- [ ] **Step 1: Write the failing test**

Create `packages/widget/tests/chat-feedback-bridge.test.ts`:
```typescript
import { describe, it, expect } from "vitest"
import { parseSSEChunk, type ChatMessage } from "../src/chat-helpers"

describe("Widget Chat Helpers (Feedback Bridge)", () => {
  it("parses text and action payload from SSE chunk", () => {
    const chunkWithAction = JSON.stringify({
      action: {
        type: "similar_post",
        post: {
          id: "p_123",
          title: "Dark Mode",
          content: "Dark mode please",
          votesCount: 10,
          status: "planned",
          boardSlug: "fitur",
        },
        similarityScore: 0.88,
      },
    })

    const parsed = parseSSEChunk(chunkWithAction)
    expect(parsed).toBeDefined()
    expect((parsed as any).action).toBeDefined()
    expect((parsed as any).action.type).toBe("similar_post")
    expect((parsed as any).action.post.title).toBe("Dark Mode")
  })

  it("handles ChatMessage structure with action and actionResolved", () => {
    const msg: ChatMessage = {
      id: "msg_1",
      sender: "juno",
      text: "Kami menemukan ide serupa di roadmap!",
      time: "10:00",
      action: {
        type: "similar_post",
        post: {
          id: "p_1",
          title: "Ekspor PDF",
          content: "Ekspor ke PDF",
          votesCount: 5,
          status: "planned",
          boardSlug: "fitur",
        },
        similarityScore: 0.75,
      },
      actionResolved: false,
    }

    expect(msg.action?.type).toBe("similar_post")
    expect(msg.actionResolved).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/widget test tests/chat-feedback-bridge.test.ts`  
Expected: FAIL if types or parse helper don't handle action

- [ ] **Step 3: Update `packages/widget/src/chat-helpers.ts`**

Update `ChatMessage` interface dan `parseSSEChunk`:
```typescript
import type { JunoActionPayload } from "@katauser/shared"

export interface ChatMessage {
  id: string
  sender: "user" | "juno" | "human"
  text: string
  time: string
  action?: JunoActionPayload
  actionResolved?: boolean
}

export function parseSSEChunk(chunkStr: string): { text?: string; action?: JunoActionPayload } | null {
  try {
    const parsed = JSON.parse(chunkStr)
    return parsed
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Update `packages/widget/src/components/tabs/MessagesTab.svelte`**

1. Tambahkan state tracking:
   ```typescript
   let guestEmail = $state("")
   let guestEmailError = $state<string | null>(null)
   let isActionLoading = $state<string | null>(null) // message id being acted on
   ```
2. Tangkap chunk `action` di listener `juno-stream` dan simpan ke objek pesan AI saat ini:
   ```typescript
   if (parsed.action) {
     activeJunoMsg.action = parsed.action
   }
   ```
3. Tambahkan fungsi handler aksi:
   - `handleVoteSimilarPost(msg: ChatMessage, postId: string)`:
     - Validasi email jika guest (`!user?.email`). Jika kosong/invalid, set `guestEmailError`.
     - Kirim `POST ${apiUrl}/api/v1/posts/${postId}/vote`.
     - Set `msg.actionResolved = true`.
     - Tambahkan pesan konfirmasi balasan dari Juno ke chat thread.
   - `handleCreateFeedbackFromChat(msg: ChatMessage, boardId: string, draft: { title: string, content: string })`:
     - Validasi email jika guest.
     - Kirim `POST ${apiUrl}/api/v1/boards/${boardId}/posts`.
     - Set `msg.actionResolved = true`.
     - Tambahkan pesan konfirmasi balasan dari Juno ke chat thread.
4. Render markup kartu aksi di dalam template chat message bubble di bawah teks Juno dengan styling Tailwind yang rapi, transisi halus, badge status, dan form input email inline untuk guest.

- [ ] **Step 5: Run tests to verify**

Run: `pnpm --filter @katauser/widget test`  
Expected: PASS on all test files

- [ ] **Step 6: Commit**

```bash
git add packages/widget/src/chat-helpers.ts packages/widget/src/components/tabs/MessagesTab.svelte packages/widget/tests/chat-feedback-bridge.test.ts
git commit -m "feat(widget): render interactive feedback action cards in Juno chat"
```

---

### Task 4: Dokumentasi Fitur & Verifikasi Menyeluruh

**Files:**
- Create: `docs/features/chat-to-feedback-bridge.md`
- Modify: `docs/features-and-workflows.md`
- Modify: `README.md`

- [ ] **Step 1: Create feature documentation**

Create `docs/features/chat-to-feedback-bridge.md` yang merangkum arsitektur, parameter deteksi, format chunk SSE, panduan integrasi widget, dan tangkapan layar/mockup alur interaksi.

- [ ] **Step 2: Update `docs/features-and-workflows.md` & `README.md`**

Tambahkan modul *Chat-to-Feedback Bridge di Juno AI* ke daftar fitur utama di `docs/features-and-workflows.md` dan `README.md`.

- [ ] **Step 3: Run full monorepo check and tests**

Run: `pnpm check && pnpm test`  
Expected: 100% PASS across all 7 packages (0 errors, 0 warnings).

- [ ] **Step 4: Commit**

```bash
git add docs/features/chat-to-feedback-bridge.md docs/features-and-workflows.md README.md
git commit -m "docs: add guide for chat-to-feedback bridge in Juno AI and update monorepo docs"
```
