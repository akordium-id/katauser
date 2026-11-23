# Spesifikasi Desain Teknis: Native MCP Server (Katauser)

**Tanggal:** 2026-11-23  
**Status:** In Review / Proposed  
**Penulis:** Antigravity & Faiq (Akordium Lab)  
**Target Rilis:** Katauser v0.6.0  
**Target Modul:** `@katauser/shared`, `@katauser/db`, `@katauser/api`, `@katauser/mcp`

---

## 1. Ringkasan Eksekutif & Tujuan

Fitur ini membangun **Native Model Context Protocol (MCP) Server** untuk Katauser. Dengan MCP Server, pengembang software dan product manager dapat menghubungkan berbagai AI coding assistant modern (**Cursor**, **Claude Code**, **Antigravity**, **Windsurf**, serta remote autonomous agents) secara langsung ke workspace Katauser mereka.

### Kemampuan Utama:
1. **Developer-First Backlog Access**: Agen AI dapat membaca feedback post terpopuler atau berbobot MRR tertinggi saat sedang merencanakan sprint di IDE.
2. **Autonomous Status Transition**: Ketika agen AI selesai mengimplementasikan fitur atau memperbaiki bug di kode, agen dapat memanggil tool `update_post_status` untuk memindahkan post ke `completed` di Katauser.
3. **Automated Changelog Drafting**: Agen AI dapat merilis catatan rilis (changelog) dengan mengaitkan ID postingan yang telah diselesaikan.
4. **Instant Feedback Logging**: Mengonversi saran atau keluhan pengguna yang muncul saat sesi diskusi/debugging menjadi post feedback terstruktur di board.

---

## 2. Arsitektur Hybrid (Opsi B)

Sistem menggunakan pendekatan **Hybrid** untuk kompatibilitas maksimal:

```
[ Cursor / Claude Code / Antigravity (Local IDE) ]
                      │
                      ▼ (STDIO Transport)
        [ packages/mcp CLI (katauser-mcp) ]
                      │
                      ▼ (HTTP REST / SSE with API Key)
    [ apps/api (Hono Backend) /api/v1/mcp ]
                      │
                      ▼
            [ Drizzle Repositories ]
                      │
                      ▼
               [ PostgreSQL 16 ]
```

1. **Remote MCP Endpoint di `apps/api`**:
   - Berjalan langsung di dalam Hono API backend (`GET /api/v1/mcp/sse` dan `POST /api/v1/mcp/messages` atau Streamable HTTP).
   - Memanfaatkan repositori Drizzle dan layanan domain yang sudah ada.
   - Diproteksi oleh middleware `requireApiKey`.
2. **CLI STDIO Bridge di `packages/mcp`**:
   - Package mandiri di monorepo yang dapat dieksekusi via `npx @katauser/mcp`.
   - Menggunakan `@modelcontextprotocol/sdk/server/stdio`.
   - Membaca `KATAUSER_API_KEY` dan `KATAUSER_API_URL` dari environment variable dan meneruskan eksekusi tool ke endpoint backend Katauser.

---

## 3. Data Model & Otentikasi API Key (`@katauser/db`)

### 3.1. Skema Tabel `workspace_api_keys` (`packages/db/src/schema/api-keys.ts`)

```typescript
import { pgTable, text, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core"
import { workspaces } from "./workspaces"

export const workspaceApiKeys = pgTable(
  "workspace_api_keys",
  {
    id: text("id").primaryKey(), // prefix 'key_'
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // misal "Claude Code Laptop Kantor", "Cursor IDE"
    keyHash: text("key_hash").notNull(), // SHA-256 hash dari token mentah
    keyPrefix: text("key_prefix").notNull(), // misal "ku_live_abc1" untuk masking UI
    permissions: jsonb("permissions").default(["read", "write"]).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("api_key_hash_unique").on(table.keyHash),
    index("api_key_workspace_idx").on(table.workspaceId),
  ]
)
```

### 3.2. Format & Hashing Token
- Token yang dibagikan ke pengguna: `ku_live_<random_32_bytes_hex>`.
- Token mentah hanya ditampilkan **satu kali** saat dibuat di dashboard admin.
- Database hanya menyimpan SHA-256 hash dari token tersebut.
- Header request: `Authorization: Bearer ku_live_...`.

---

## 4. Definisi Toolset V1 (`@katauser/shared` & `@katauser/mcp`)

Seluruh input schema didefinisikan dengan Zod di `@katauser/shared`:

### 4.1. `list_feedback`
Mengambil daftar feedback post dengan filter fleksibel.
* **Input Schema**:
  ```typescript
  z.object({
    status: z.enum(["all", "open", "planned", "in_progress", "completed", "closed"]).optional().default("all"),
    boardSlug: z.string().optional(),
    sortBy: z.enum(["popular", "recent", "mrr"]).optional().default("popular"),
    limit: z.number().min(1).max(50).optional().default(10),
  })
  ```
* **Output**: Daftar ringkas post beserta vote count, total MRR, dan status.

### 4.2. `get_feedback_details`
Mengambil informasi lengkap satu post, termasuk deskripsi, komentar, voter, dan issue Linear tertaut.
* **Input Schema**:
  ```typescript
  z.object({
    postId: z.string().describe("ID post feedback (format 'post_...')"),
  })
  ```

### 4.3. `create_feedback`
Membuat post masukan baru langsung dari AI agent.
* **Input Schema**:
  ```typescript
  z.object({
    title: z.string().min(3),
    content: z.string().min(5),
    boardSlug: z.string().optional().describe("Slug board tujuan, default ke board pertama"),
    customerEmail: z.string().email().optional().describe("Email customer jika diinput atas nama customer"),
    customerName: z.string().optional(),
    customerCompany: z.string().optional(),
    customerMrr: z.number().optional(),
  })
  ```

### 4.4. `update_post_status`
Memperbarui status pengerjaan fitur (misal selesai dikoding oleh AI).
* **Input Schema**:
  ```typescript
  z.object({
    postId: z.string(),
    status: z.enum(["planned", "in_progress", "completed", "closed"]),
    notifyVoters: z.boolean().optional().default(true).describe("Kirim notifikasi email ke voters jika status completed"),
  })
  ```

### 4.5. `get_roadmap_kanban`
Mengambil ringkasan post yang berada di roadmap.
* **Input Schema**: `z.object({})`
* **Output**: Objek `{ planned: [...], inProgress: [...], completed: [...] }`.

### 4.6. `create_changelog_release`
Mempublikasikan catatan rilis baru dan mengaitkannya dengan daftar post.
* **Input Schema**:
  ```typescript
  z.object({
    version: z.string().describe("Nomor versi rilis, misal 'v1.4.0'"),
    title: z.string(),
    content: z.string().describe("Isi catatan rilis dalam Markdown"),
    postIds: z.array(z.string()).optional().describe("Daftar post ID yang dirilis pada versi ini"),
  })
  ```

---

## 5. Konfigurasi Client AI

### Claude Code & Desktop (`~/.claude.json` / `claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "katauser": {
      "command": "npx",
      "args": ["-y", "@katauser/mcp"],
      "env": {
        "KATAUSER_API_URL": "http://localhost:3000",
        "KATAUSER_API_KEY": "ku_live_7a8b9c..."
      }
    }
  }
}
```

### Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "katauser": {
      "command": "npx",
      "args": ["-y", "@katauser/mcp"],
      "env": {
        "KATAUSER_API_URL": "https://api.yourdomain.com",
        "KATAUSER_API_KEY": "ku_live_7a8b9c..."
      }
    }
  }
}
```

---

## 6. Strategi Pengujian (TDD)

1. **Unit Test API Key Repositori (`packages/db/tests/api-keys.test.ts`)**:
   - Pembuatan API key baru, hashing SHA-256, validasi token, dan pencatatan `lastUsedAt`.
2. **API Endpoint & Auth Middleware Tests (`apps/api/tests/mcp-auth.test.ts`)**:
   - Request tanpa token -> 401 Unauthorized.
   - Request dengan token tidak valid -> 401 Unauthorized.
   - Request dengan token valid -> lolos dengan context `workspaceId`.
3. **MCP Tools Execution Tests (`apps/api/tests/mcp-tools.test.ts` & `packages/mcp/tests/`)**:
   - Pengujian pemanggilan setiap tool (`list_feedback`, `create_feedback`, `update_post_status`, dll.) memastikan response sesuai kontrak MCP standard.
