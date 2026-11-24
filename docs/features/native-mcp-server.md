# Panduan Fitur: Native MCP Server (Katauser)

Dokumen ini menjelaskan implementasi fitur **Native Model Context Protocol (MCP) Server** pada Katauser. Dengan fitur ini, AI coding assistant modern seperti **Cursor**, **Claude Code**, **Antigravity**, **Windsurf**, maupun remote AI agent dapat berinteraksi secara aman dengan backlog feedback, roadmap, status pengerjaan, dan changelog di workspace Katauser Anda.

---

## 1. Arsitektur Hybrid

Katauser mengadopsi pendekatan **Hybrid** untuk mendukung berbagai lingkungan AI:

```text
[ Cursor / Claude Code / Antigravity (Local IDE) ]
                      │
                      ▼ (STDIO Transport)
        [ @katauser/mcp CLI (katauser-mcp) ]
                      │
                      ▼ (HTTP REST with API Key)
    [ apps/api (Hono Backend) /api/v1/mcp ]
                      │
                      ▼
            [ Drizzle Repositories ]
                      │
                      ▼
               [ PostgreSQL 16 ]
```

1. **Remote MCP Server di Backend (`apps/api`)**:
   - Endpoint: `/api/v1/mcp/tools` (GET untuk discovery tool, POST untuk eksekusi tool).
   - Memanfaatkan database Drizzle ORM langsung di server.
   - Diproteksi secara ketat oleh middleware `requireApiKey`.
2. **CLI STDIO Bridge (`@katauser/mcp`)**:
   - Package CLI mandiri di monorepo yang dapat langsung dijalankan melalui `npx @katauser/mcp`.
   - Menggunakan `@modelcontextprotocol/sdk/server/stdio`.
   - Menghubungkan client lokal (STDIO) dengan API backend Katauser (HTTP) via environment variables `KATAUSER_API_KEY` dan `KATAUSER_API_URL`.

---

## 2. Otentikasi & API Key Management

Setiap interaksi MCP diwajibkan menyertakan API Key:

- **Format Token**: `ku_live_<32_bytes_random_hex>` (misal `ku_live_7a8b9c0d1e2f...`).
- **Hashing**: Token mentah hanya ditampilkan satu kali saat dibuat; database Katauser hanya menyimpan **SHA-256 hash** pada tabel `workspace_api_keys`.
- **Tenant Isolation**: Setiap API Key terikat secara permanen ke satu `workspaceId`. Permintaan yang mencoba membaca atau memperbarui data milik workspace lain akan ditolak (404/401).

---

## 3. Konfigurasi Client AI

### A. Claude Code & Claude Desktop

Tambahkan konfigurasi ke `~/.claude.json` (atau `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "katauser": {
      "command": "npx",
      "args": ["-y", "@katauser/mcp"],
      "env": {
        "KATAUSER_API_URL": "https://api.yourdomain.com",
        "KATAUSER_API_KEY": "ku_live_YOUR_SECRET_API_KEY"
      }
    }
  }
}
```

### B. Cursor IDE

Tambahkan konfigurasi ke `.cursor/mcp.json` di root workspace proyek Anda:

```json
{
  "mcpServers": {
    "katauser": {
      "command": "npx",
      "args": ["-y", "@katauser/mcp"],
      "env": {
        "KATAUSER_API_URL": "https://api.yourdomain.com",
        "KATAUSER_API_KEY": "ku_live_YOUR_SECRET_API_KEY"
      }
    }
  }
}
```

---

## 4. Daftar Tools V1

| Nama Tool                  | Deskripsi                                                                               | Parameter Utama                                                       |
| -------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `list_feedback`            | Mengambil daftar post masukan dengan filter fleksibel                                   | `status`, `boardSlug`, `sortBy` (`popular`, `recent`, `mrr`), `limit` |
| `get_feedback_details`     | Membaca detail post, komentar, voter, dan tiket Linear                                  | `postId`                                                              |
| `create_feedback`          | Membuat post masukan baru dari percakapan AI                                            | `title`, `content`, `customerEmail`, `customerMrr`                    |
| `update_post_status`       | Memperbarui status implementasi fitur (`planned`, `in_progress`, `completed`, `closed`) | `postId`, `status`, `notifyVoters`                                    |
| `get_roadmap_kanban`       | Mengambil ringkasan roadmap 3 kolom                                                     | _(tanpa parameter)_                                                   |
| `create_changelog_release` | Mempublikasikan catatan rilis changelog baru                                            | `version`, `title`, `content`, `postIds`                              |

---

## 5. Contoh Prompt Interaksi dengan AI

- _"Tolong ambil 5 saran fitur dengan nilai MRR tertinggi yang saat ini masih berstatus `planned` dari Katauser."_
- _"Saya baru saja menyelesaikan implementasi ekspor PDF (Post #p_123). Tolong ubah statusnya menjadi `completed` di Katauser."_
- _"Buatkan rilis changelog v1.3.0 untuk fitur yang selesai di sprint ini dengan ringkasan perubahan yang rapi."_
- _"Pengguna di sesi support tadi meminta opsi integrasi Slack. Catat idenya ke Katauser atas nama budi@company.com dengan estimasi MRR $400."_
