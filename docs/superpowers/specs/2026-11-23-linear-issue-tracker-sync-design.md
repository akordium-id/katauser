# Spesifikasi Desain Teknis: Sinkronisasi Linear Issue Tracker (Katauser)

**Tanggal:** 2026-11-23  
**Status:** Disetujui  
**Target Modul:** `@katauser/shared`, `@katauser/db`, `@katauser/api`, `@katauser/web`

---

## 1. Ringkasan Eksekutif & Tujuan

Fitur ini mengintegrasikan Katauser dengan **Linear** (issue tracking tool untuk tim modern software engineering). Tujuannya adalah menutup siklus umpan balik pelanggan (_customer feedback loop_) secara otomatis:

1. **Push & Link**: Admin/pengelola produk dapat membuat issue baru di Linear langsung dari post Katauser atau menautkan issue Linear yang sudah ada.
2. **Execution Source of Truth**: Developer bekerja normal di Linear. Ketika issue di Linear dipindahkan ke status selesai (`state.type === 'completed'`), Linear mengirim webhook ke Katauser.
3. **Automated Closing & Voter Notification**: Katauser secara otomatis memperbarui status post menjadi `completed`, memicu notifikasi email pembaruan ke seluruh voters via Resend, dan meneruskan notifikasi ke channel Slack/Discord.

Sistem dirancang ramah untuk lingkungan **self-hosted** (menggunakan Personal API Key / Personal Access Token dan Webhook Secret, tanpa dependensi OAuth app yang rumit) dengan arsitektur modular (`IssueTrackerProvider`) agar mudah diperluas ke GitHub Issues di masa mendatang.

---

## 2. Arsitektur Data Model (`@katauser/db`)

### Skema Tabel Baru (`packages/db/src/schema/integrations.ts`)

```typescript
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { workspaces } from "./workspaces"
import { posts } from "./feedback"

// 1. Kredensial dan konfigurasi provider per workspace
export const workspaceIntegrations = pgTable(
  "workspace_integrations",
  {
    id: text("id").primaryKey(), // prefix 'wint_'
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'linear' | 'github'
    apiKey: text("api_key").notNull(),
    webhookSecret: text("webhook_secret").notNull(),
    config: jsonb("config").default({}).notNull(), // { defaultTeamId, defaultTeamKey, organizationName }
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspace_provider_unique").on(
      table.workspaceId,
      table.provider,
    ),
  ],
)

// 2. Relasi antara Feedback Post dengan External Issue Tracker
export const postIssues = pgTable(
  "post_issues",
  {
    id: text("id").primaryKey(), // prefix 'piss_'
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'linear'
    externalIssueId: text("external_issue_id").notNull(), // Linear UUID untuk pencocokan webhook
    issueIdentifier: text("issue_identifier").notNull(), // misal 'ENG-142'
    issueUrl: text("issue_url").notNull(), // URL langsung ke Linear
    issueTitle: text("issue_title").notNull(),
    issueStatus: text("issue_status").notNull(), // misal 'In Progress', 'Done'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_provider_issue_unique").on(
      table.postId,
      table.provider,
      table.externalIssueId,
    ),
    index("post_issues_external_id_idx").on(
      table.provider,
      table.externalIssueId,
    ),
  ],
)
```

---

## 3. Kontrak & Validasi Zod (`@katauser/shared`)

### Interface Provider

```typescript
export interface LinearTeam {
  id: string
  name: string
  key: string
}

export interface LinearIssueResult {
  id: string
  identifier: string // 'ENG-142'
  title: string
  url: string
  status: string // 'In Progress', 'Done'
  stateType: string // 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'
}

export interface IssueTrackerProvider {
  testConnection(
    apiKey: string,
  ): Promise<{ success: boolean; organizationName?: string }>
  listTeams(apiKey: string): Promise<LinearTeam[]>
  createIssue(
    apiKey: string,
    input: {
      teamId: string
      title: string
      description?: string
      priority?: number
    },
  ): Promise<LinearIssueResult>
  getIssue(apiKey: string, issueIdOrKey: string): Promise<LinearIssueResult>
}
```

### Skema Validasi Zod (`packages/shared/src/schemas/integrations.ts`)

- `saveLinearIntegrationSchema`:
  - `apiKey`: `z.string().min(1, "API Key Linear wajib diisi")`
  - `webhookSecret`: `z.string().min(1, "Webhook Secret wajib diisi")`
  - `defaultTeamId`: `z.string().optional()`
- `createLinearIssueSchema`:
  - `postId`: `z.string().min(1)`
  - `teamId`: `z.string().min(1, "Pilih tim Linear")`
  - `title`: `z.string().min(1, "Judul issue wajib diisi")`
  - `description`: `z.string().optional()`
  - `priority`: `z.number().int().min(0).max(4).default(0)`
- `linkLinearIssueSchema`:
  - `postId`: `z.string().min(1)`
  - `issueIdOrKey`: `z.string().min(1, "Masukkan ID atau identifier issue (misal ENG-142)")`

---

## 4. Backend & Linear GraphQL Engine (`apps/api`)

### GraphQL Operations

Komunikasi ke Linear menggunakan native `fetch` langsung ke endpoint `https://api.linear.app/graphql`:

- **Header**: `Authorization: <apiKey>`, `Content-Type: application/json`.
- **Query Viewer**: `query { viewer { id name organization { name } } }`
- **Query Teams**: `query { teams { nodes { id name key } } }`
- **Mutation IssueCreate**:
  ```graphql
  mutation IssueCreate($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        title
        url
        state {
          name
          type
        }
      }
    }
  }
  ```
  Setiap issue yang dibuat otomatis menyertakan footer markdown yang menautkan kembali ke post Katauser.

### Endpoint API Hono (`apps/api/src/modules/integrations/linear.route.ts`)

1. `GET /api/v1/workspaces/:slug/integrations/linear`  
   Mendapatkan konfigurasi aktif (tanpa mengekspos full API Key) dan daftar team Linear.
2. `POST /api/v1/workspaces/:slug/integrations/linear`  
   Menyimpan atau memperbarui API Key, Webhook Secret, dan Default Team.
3. `POST /api/v1/workspaces/:slug/integrations/linear/test`  
   Menguji koneksi API Key dan mengambil nama organisasi Linear.
4. `GET /api/v1/workspaces/:slug/posts/:postId/issues`  
   Mengambil issue yang tertaut dengan post tertentu.
5. `POST /api/v1/workspaces/:slug/posts/:postId/issues/linear`  
   Membuat issue baru di Linear dan menautkannya ke post.
6. `POST /api/v1/workspaces/:slug/posts/:postId/issues/linear/link`  
   Menautkan issue Linear yang sudah ada via ID atau identifier (`ENG-142`).
7. `DELETE /api/v1/workspaces/:slug/posts/:postId/issues/:issueId`  
   Menghapus relasi tautan issue dari post.

---

## 5. Inbound Webhook & Otomasi Voter (`apps/api`)

### Endpoint Webhook

- **URL**: `POST /api/v1/integrations/linear/webhook/:workspaceSlug`
- **Autentikasi**: Memverifikasi header `Linear-Signature` menggunakan HMAC SHA-256 dan `crypto.timingSafeEqual` terhadap raw request body.

### Logika Eksekusi Webhook

1. Verifikasi tanda tangan digital. Jika gagal, kembalikan `401 Unauthorized`.
2. Parse payload event. Filter hanya event `type === "Issue"` dan `action === "update"`.
3. Cari entri di tabel `post_issues` dengan `provider = 'linear'` dan `externalIssueId = data.id`.
4. Jika ditemukan:
   - Perbarui kolom `issueStatus` di `post_issues` dengan `data.state.name`.
   - Jika `data.state.type === "completed"` dan status post saat ini belum `completed`:
     1. Perbarui `posts.status = 'completed'` di database.
     2. **Idempotensi**: Pastikan tidak terjadi pengiriman notifikasi ganda jika webhook di-retry oleh Linear.
     3. Kirimkan email notifikasi transaksional via Resend kepada semua voter yang terdaftar di tabel `votes` untuk post tersebut.
     4. Kirim notifikasi outbound ke webhook Slack dan Discord workspace jika terkonfigurasi.

---

## 6. Antarmuka Pengguna Frontend (`apps/web`)

### Halaman Pengaturan (`/settings/integrations`)

- Menambahkan kartu **Linear Issue Tracker**:
  - Form input API Key dan Webhook Secret.
  - Tampilan URL Webhook instan dengan tombol _1-Click Copy_: `https://<domain>/api/v1/integrations/linear/webhook/<workspaceSlug>`.
  - Dropdown pemilihan _Default Team_ yang terisi otomatis setelah API Key divalidasi.
  - Tombol aksi: _Uji Koneksi_, _Simpan_, dan _Putuskan Koneksi_.

### Drawer / Detail Post Admin

- Kartu **Issue Tracker**:
  - Jika belum tertaut: Tombol _+ Buat Issue Linear_ (modal dengan prefilled title/content dan pilihan team/prioritas) dan tombol _Tautkan Issue Existing_ (input ID/identifier).
  - Jika sudah tertaut: Menampilkan badge Linear `ENG-142` (klik membuka tab baru ke Linear), badge status (misal `Done` warna hijau, `In Progress` warna biru), dan tombol _Unlink_.

---

## 7. Penanganan Error & Pengujian Otomatis

### Edge Cases

- **Linear API Down / Rate Limited**: Error ditangani secara terstruktur dan pesan ramah pengguna ditampilkan di UI.
- **Issue Dihapus di Linear**: Tampilan antarmuka menandai issue sebagai tidak ditemukan dengan opsi unlink manual.
- **Post Dihapus di Katauser**: Relasi di `post_issues` otomatis terhapus berkat `onDelete: 'cascade'`, tanpa menghapus issue di Linear.

### Test Suites (Vitest)

1. `tests/integrations-repo.test.ts`: Uji operasi CRUD dan unique constraints pada skema database.
2. `tests/linear-schemas.test.ts`: Uji validasi Zod input API Key, pembuatan issue, dan linking.
3. `tests/linear-provider.test.ts`: Uji mock GraphQL Linear untuk test koneksi, list teams, create issue, dan get issue.
4. `tests/linear-webhook.test.ts`: Uji verifikasi HMAC signature, update status otomatis, dan dispatch notifikasi voter.
5. `tests/linear-settings.test.ts`: Uji render antarmuka dan interaksi form integrasi.
