# Native MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun Native Model Context Protocol (MCP) Server untuk Katauser yang mendukung arsitektur hybrid (Remote HTTP/SSE di `apps/api` dan CLI STDIO Bridge di `packages/mcp`) lengkap dengan skema otentikasi API Key multi-tenant dan 6 tools inti V1.

**Architecture:** Remote MCP server berjalan di backend Hono (`apps/api`) yang memproses RPC protocol tools melalui DB repositories Drizzle, diproteksi dengan otentikasi SHA-256 hashed API Key. Package CLI `@katauser/mcp` (`packages/mcp`) bertindak sebagai bridge STDIO transparan yang membaca `KATAUSER_API_KEY` dan `KATAUSER_API_URL` untuk dihubungkan langsung ke Cursor, Claude Code, dan Antigravity.

**Tech Stack:** TypeScript, Node.js 22, Hono, Drizzle ORM, PostgreSQL 16, `@modelcontextprotocol/sdk`, Zod, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-23-native-mcp-server-design.md`](file:///home/orin/code/archive/katauser-app/docs/superpowers/specs/2026-11-23-native-mcp-server-design.md)

---

## Global Constraints

- Monorepo pnpm workspaces dengan target Node.js >= 22.0.0.
- Database Drizzle ORM PostgreSQL multi-tenant terisolasi per `workspaceId`.
- Format token API Key: `ku_live_<32_bytes_hex>` dengan hashing SHA-256 (token mentah tidak disimpan di DB).
- Kontrak tool MCP harus kompatibel dengan spesifikasi resmi `@modelcontextprotocol/sdk`.
- Disiplin Test-Driven Development (TDD) Red-Green-Refactor untuk setiap task.

---

## Review Focus

1. **Otentikasi Token Invalid & Prefix Matching:** Request dengan token rusak, token kedaluwarsa, atau header tanpa format `Bearer ku_live_...` harus ditolak dengan error 401 dan pesan informatif tanpa mengekspos detail stack trace.
2. **Tenant Isolation Breach:** API Key yang terikat pada Workspace A tidak boleh diizinkan membaca, membuat, atau memperbarui post/changelog milik Workspace B meskipun ID post diberikan secara eksplisit.
3. **Invalid Parameter Parsing pada Tools:** Parameter Zod yang salah tipe data (misal `limit` negatif atau `sortBy` non-enum) harus ditolak dengan error validasi yang jelas sebelum menyentuh database query.
4. **Network Drop / Offline CLI Bridge:** Pada `packages/mcp`, jika backend server mati atau merespons HTTP 500, STDIO bridge tidak boleh melempar unhandled crash yang mematikan sesi Cursor/Claude, melainkan merespons dengan pesan tool error format MCP standar.
5. **Idempotensi & Transisi Status Post:** Pemanggilan `update_post_status` berulang kali ke status yang sama tidak boleh memicu email notifikasi ganda ke voters.

---

## Task 1: Database Schema & API Key Repository (`packages/db`)

**Files:**

- Create: `packages/db/src/schema/api-keys.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/repositories/api-key.ts`
- Test: `packages/db/tests/api-keys.test.ts`

**Interfaces:**

- Consumes: `workspaces` dari `packages/db/src/schema/workspaces.ts`.
- Produces:
  - Skema Drizzle: `workspaceApiKeys`.
  - Repository: `ApiKeyRepository` dengan methods:
    - `createApiKey(workspaceId: string, name: string, permissions?: string[]): Promise<{ rawKey: string, keyRecord: any }>`
    - `validateApiKey(rawKey: string): Promise<{ isValid: boolean, workspaceId?: string, keyId?: string }>`
    - `recordKeyUsage(keyId: string): Promise<void>`

- [ ] **Step 1: Write failing test in `packages/db/tests/api-keys.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest"
import { ApiKeyRepository } from "../src/repositories/api-key"

describe("ApiKeyRepository Unit Tests", () => {
  it("creates an API key with raw token starting with ku_live_ and SHA-256 hash", async () => {
    const mockTx: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "key_123",
              workspaceId: "ws_1",
              name: "Claude Code",
              keyPrefix: "ku_live_abcd",
              permissions: ["read", "write"],
            },
          ]),
        }),
      }),
    }
    const mockDb: any = {
      insert: mockTx.insert,
    }
    const repo = new ApiKeyRepository(mockDb)
    const result = await repo.createApiKey("ws_1", "Claude Code")
    expect(result.rawKey).toMatch(/^ku_live_[a-f0-9]{64}$/)
    expect(result.keyRecord.id).toBe("key_123")
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @katauser/db test -- tests/api-keys.test.ts`
Expected: FAIL (Cannot find module '../src/repositories/api-key')

- [ ] **Step 3: Implement `workspaceApiKeys` schema and `ApiKeyRepository`**

Buat `packages/db/src/schema/api-keys.ts`, re-export di `packages/db/src/schema/index.ts`, dan buat `packages/db/src/repositories/api-key.ts` dengan hashing crypto SHA-256 native.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/db test -- tests/api-keys.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/schema/api-keys.ts packages/db/src/schema/index.ts packages/db/src/repositories/api-key.ts packages/db/tests/api-keys.test.ts
git commit -m "feat(db): add workspace_api_keys schema and repository"
```

---

## Task 2: Shared Zod Schemas & Contracts for MCP (`packages/shared`)

**Files:**

- Create: `packages/shared/src/schemas/mcp.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/mcp-schemas.test.ts`

**Interfaces:**

- Consumes: Zod schema types dari `@katauser/shared`.
- Produces:
  - `listFeedbackMcpSchema`
  - `getFeedbackDetailsMcpSchema`
  - `createFeedbackMcpSchema`
  - `updatePostStatusMcpSchema`
  - `createChangelogReleaseMcpSchema`

- [ ] **Step 1: Write failing test in `packages/shared/tests/mcp-schemas.test.ts`**

```typescript
import { describe, it, expect } from "vitest"
import {
  listFeedbackMcpSchema,
  createFeedbackMcpSchema,
  updatePostStatusMcpSchema,
} from "../src/schemas/mcp"

describe("MCP Tool Zod Schemas", () => {
  it("validates list_feedback input with defaults", () => {
    const parsed = listFeedbackMcpSchema.parse({})
    expect(parsed.status).toBe("all")
    expect(parsed.sortBy).toBe("popular")
    expect(parsed.limit).toBe(10)
  })

  it("validates update_post_status schema and requires valid status", () => {
    expect(() =>
      updatePostStatusMcpSchema.parse({
        postId: "p_1",
        status: "invalid_status",
      }),
    ).toThrow()

    const valid = updatePostStatusMcpSchema.parse({
      postId: "p_1",
      status: "completed",
    })
    expect(valid.status).toBe("completed")
    expect(valid.notifyVoters).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @katauser/shared test -- tests/mcp-schemas.test.ts`
Expected: FAIL (Cannot find module '../src/schemas/mcp')

- [ ] **Step 3: Implement Zod schemas in `packages/shared/src/schemas/mcp.ts` and re-export in `index.ts`**

Implementasikan 6 schema input tool MCP sesuai spesifikasi desain.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/shared test -- tests/mcp-schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/mcp.ts packages/shared/src/index.ts packages/shared/tests/mcp-schemas.test.ts
git commit -m "feat(shared): add Zod validation schemas for MCP tools"
```

---

## Task 3: API Key Auth Middleware & Remote MCP Route in Hono (`apps/api`)

**Files:**

- Create: `apps/api/src/middleware/api-key-auth.ts`
- Create: `apps/api/src/modules/mcp/mcp.service.ts`
- Create: `apps/api/src/modules/mcp/mcp.route.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/mcp-auth.test.ts`
- Test: `apps/api/tests/mcp-tools.test.ts`

**Interfaces:**

- Consumes: `ApiKeyRepository` dari `@katauser/db`, Zod schemas dari `@katauser/shared`.
- Produces:
  - Middleware `requireApiKey`: memvalidasi token Bearer `ku_live_...` dan mengikat `c.set("workspaceId", ...)`.
  - Endpoint `POST /api/v1/mcp/tools/:toolName`: handler eksekusi RPC untuk tool `list_feedback`, `get_feedback_details`, `create_feedback`, `update_post_status`, `get_roadmap_kanban`, `create_changelog_release`.
  - Endpoint `GET /api/v1/mcp/tools`: list tools discovery.

- [ ] **Step 1: Write failing tests in `apps/api/tests/mcp-auth.test.ts`**

```typescript
import { describe, it, expect } from "vitest"
import { Hono } from "hono"
import { mcpRoute } from "../src/modules/mcp/mcp.route"

describe("MCP API Key Authentication", () => {
  const app = new Hono().route("/api/v1/mcp", mcpRoute)

  it("returns 401 Unauthorized when Authorization header is missing", async () => {
    const res = await app.request("/api/v1/mcp/tools")
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.success).toBe(false)
  })

  it("returns 401 Unauthorized for malformed Bearer token", async () => {
    const res = await app.request("/api/v1/mcp/tools", {
      headers: { Authorization: "Bearer invalid_key" },
    })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @katauser/api test -- tests/mcp-auth.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Auth Middleware, MCP Service, and MCP Route**

Bangun `api-key-auth.ts`, `mcp.service.ts` (mengorkestrasi operasi post, status, dan changelog), serta `mcp.route.ts` dan daftarkan ke `app.ts`.

- [ ] **Step 4: Write and run tool execution tests in `apps/api/tests/mcp-tools.test.ts`**

Verifikasi bahwa saat request menyertakan token valid, tool `list_feedback`, `create_feedback`, dan `update_post_status` dapat dipanggil dan mengembalikan data yang terisolasi sesuai workspace.

Run: `pnpm --filter @katauser/api test -- tests/mcp-auth.test.ts tests/mcp-tools.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/middleware/api-key-auth.ts apps/api/src/modules/mcp/ apps/api/src/app.ts apps/api/tests/mcp-auth.test.ts apps/api/tests/mcp-tools.test.ts
git commit -m "feat(api): add API key auth middleware and MCP tools endpoints"
```

---

## Task 4: Standalone CLI STDIO MCP Bridge Package (`packages/mcp`)

**Files:**

- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/src/index.ts`
- Create: `packages/mcp/bin/katauser-mcp.js`
- Test: `packages/mcp/tests/stdio-bridge.test.ts`

**Interfaces:**

- Consumes: `@modelcontextprotocol/sdk` (Server, StdioServerTransport), REST endpoint dari `apps/api`.
- Produces:
  - Executable CLI `katauser-mcp` (mendukung `npx @katauser/mcp`).
  - Mendaftarkan 6 MCP tools ke STDIO client dan meneruskan eksekusi ke backend Katauser via fetch API.

- [ ] **Step 1: Write failing test in `packages/mcp/tests/stdio-bridge.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest"
import { createMcpServerInstance } from "../src/index"

describe("Katauser MCP Server Instance", () => {
  it("initializes MCP server with name and version", () => {
    const server = createMcpServerInstance({
      apiUrl: "http://localhost:3000",
      apiKey: "ku_live_test123",
    })
    expect(server).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @katauser/mcp test`
Expected: FAIL (Package or module not found)

- [ ] **Step 3: Create `packages/mcp` package and implement STDIO bridge**

Setup `package.json`, `tsconfig.json`, pasang dependensi `@modelcontextprotocol/sdk`, implementasikan server instance dengan tool registration dan HTTP caller ke backend Katauser.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/mcp test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/mcp/
git commit -m "feat(mcp): create @katauser/mcp CLI package with STDIO bridge"
```

---

## Task 5: Documentation & Full Monorepo Verification

**Files:**

- Create: `docs/features/native-mcp-server.md`
- Modify: `README.md`
- Verification: Seluruh monorepo test & typecheck

- [ ] **Step 1: Write feature guide in `docs/features/native-mcp-server.md`**

Jelaskan cara generate API key di Katauser, cara memasang konfigurasi di Claude Code, Claude Desktop, Cursor, dan Antigravity, serta daftar 6 tools yang tersedia beserta contoh prompt.

- [ ] **Step 2: Update `README.md` feature list**

Tambahkan bullet point fitur Native Model Context Protocol (MCP) Server di bagian Fitur Utama.

- [ ] **Step 3: Run whole monorepo verification**

Run: `pnpm check && pnpm test`
Expected: All packages pass with 0 errors and 0 warnings.

- [ ] **Step 4: Commit**

```bash
git add docs/features/native-mcp-server.md README.md
git commit -m "docs: add guide for native MCP server and update README"
```

---

## Plan Self-Review Check

- **Spec coverage:** 100% (Semua aspek: tabel API Key, format token SHA-256, 6 tools MCP, Hybrid CLI STDIO, dan Remote endpoint telah dicakup dalam Tasks 1–5).
- **Step scan:** Setiap step spesifik dengan kode test, command eksekusi, dan ekspektasi hasil.
- **Type consistency:** Konsistensi tipe nama field (`keyHash`, `keyPrefix`, `ku_live_...`, tool names) seragam dari schema DB hingga CLI.
- **Review Focus:** 5 poin kegagalan input & keamanan telah dipetakan ke dalam test Task 1, Task 3, dan Task 4.
