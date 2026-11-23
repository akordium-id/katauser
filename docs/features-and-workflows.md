# Dokumentasi Fitur & Alur Kerja Teknis Katauser

Dokumen ini merangkum arsitektur, modul utama, dan alur kerja teknis di monorepo Katauser yang telah diselesaikan.

---

## 1. Workspace Hub & Dashboard Admin

### Rute & Alur Navigasi

- **/account**: Berfungsi sebagai _Workspace Hub_. Menampilkan daftar workspace milik user, status plan (`Free` / `Pro`), jumlah board aktif, tombol akses cepat ke dashboard, dan tautan ke portal publik.
- **/dashboard**: Otomatis me-redirect pengguna ke `/account`.
- **/dashboard/[workspaceSlug]**: Otomatis me-redirect ke `/dashboard/[workspaceSlug]/boards`.
- **/dashboard/[workspaceSlug]/boards**: Manajemen papan masukan (tambah board baru, filter, status).
- **/dashboard/[workspaceSlug]/inbox**: Kotak masuk live chat AI Juno dan eskalasi customer support.
- **/dashboard/[workspaceSlug]/changelog/new**: Studio penulisan rilis catatan pembaruan.
- **/dashboard/[workspaceSlug]/settings/**:
  - `domain`: Konfigurasi custom domain CNAME & SSL.
  - `integrations`: Konfigurasi webhook Slack Block Kit & Discord Rich Embeds.
  - `ai`: Basis pengetahuan RAG AI Juno (artikel, FAQ, chunk vektor).
  - `widget`: Generator dan kustomisasi kode embed widget.

### Arsitektur Layout

- **Unified Sidebar (`apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/+layout.svelte`)**:
  - Mengelompokkan modul ke dalam dua grup utama: _Manajemen Produk_ dan _Pengaturan_.
  - Dilengkapi workspace switcher ke `/account`, menu dropdown tautan portal publik, dan mobile drawer responsif.
  - 100% menggunakan library ikon `lucide-svelte`.

---

## 2. Database Seeder untuk Onboarding (`pnpm db:seed`)

### Cara Menjalankan

```bash
# Menggunakan environment variable DATABASE_URL lokal atau default:
pnpm db:seed
```

### Struktur File

- **`packages/db/src/seed-data.ts`**: Pure data definisi demo (bisa diuji via Vitest tanpa koneksi DB).
- **`packages/db/src/seed.ts`**: Runner CLI yang menjalankan operasi _idempotent upsert_ (`onConflictDoUpdate` / `onConflictDoNothing`).

### Data Demo yang Di-seed

1. **Admin Demo User**:
   - Email: `demo@katauser.com`
   - Password: `katauser123` (di-hash dengan `scryptSync` native `node:crypto`).
   - Role: `admin`.
2. **Workspace Contoh**:
   - `Acme Corp` (slug: `acme`, plan: `pro`).
3. **Customer Personas (MRR Weighted)**:
   - Budi Santoso (`budi@techindo.id` — Enterprise MRR \$299).
   - Siti Rahma (`siti@cloudscale.io` — Growth MRR \$99).
   - Alex Chandra (`alex@digiagency.com` — Starter MRR \$49).
4. **Boards**:
   - `fitur` (_Papan Ide & Fitur_).
   - `kendala` (_Laporan Kendala & Bug_).
5. **Feedback Posts (5 Post Nyata)**:
   - Integrasi Discord & Slack Webhook (`in_progress`, 54 votes).
   - Single Sign-On (SSO) SAML / Okta (`planned`, 38 votes).
   - Dukungan Tema Gelap di Widget Embed (`completed`, 29 votes).
   - Ekspor Masukan ke Format CSV & Excel (`under_review`, 16 votes).
   - Notifikasi Email Terlambat (`completed`, 7 votes).
6. **Changelog**:
   - Rilis publik v1.2.0 (_Dukungan Dark Mode di Widget & Optimasi Ukuran Bundle_).

---

## 3. Embed Widget Generator (`/settings/widget`)

Memungkinkan pengelola produk mengonfigurasi dan mempratinjau widget sebelum dipasang di aplikasi web host.

### Fitur Kustomisasi

- **Posisi**: `bottom-right` (kanan bawah) atau `bottom-left` (kiri bawah).
- **Warna Aksen**: Preset warna (Indigo, Emerald, Violet, Rose, Slate) atau custom hex input.
- **Default Tab**: `feedback`, `roadmap`, `changelog`, atau `messages`.
- **Tema**: `auto` (mengikuti host/sistem), `light`, atau `dark`.

### Format Pemasangan

#### A. Universal HTML Script Tag (1 Baris)

```html
<script
  defer
  src="https://katauser.com/widget/katauser.js"
  data-workspace="acme"
  data-position="bottom-right"
  data-color="#4f46e5"
  data-default-tab="feedback"
  data-theme="auto"
></script>
```

#### B. Modern SPA / Framework (NPM)

```typescript
import { Katauser } from "@katauser/widget"

// 1. Inisialisasi
Katauser.init({
  workspace: "acme",
  position: "bottom-right",
  primaryColor: "#4f46e5",
})

// 2. Identifikasi pengguna yang sedang login
Katauser.identify({
  userId: "usr_12345",
  email: "customer@domain.com",
  name: "Nama Pengguna",
  hash: "HMAC_SHA256_SERVER_HASH", // Opsional untuk verifikasi keamanan
})
```

#### C. Keamanan HMAC Identity

Untuk mencegah pemalsuan identitas pelanggan dan bobot MRR, generate HMAC hash di backend aplikasi host:

```typescript
import { createHmac } from "node:crypto"

const secret = process.env.KATAUSER_JWT_SECRET
const userHash = createHmac("sha256", secret)
  .update(user.email.toLowerCase().trim())
  .digest("hex")
```

---

## 4. Portal Publik Tenant

Portal publik digunakan oleh end-user untuk berpartisipasi menyampaikan feedback, melihat progres tim, dan membaca pengumuman rilis.

### Rute Publik

- **/b/[workspaceSlug]**: Loader `+page.server.ts` secara otomatis me-redirect ke board aktif pertama (`/b/[workspaceSlug]/[boardSlug]`) untuk menghindari 404.
- **/b/[workspaceSlug]/[boardSlug]**: Papan masukan publik dengan filter status, pengurutan, voting optimistik, dan modal pengiriman ide baru.
- **/roadmap/[workspaceSlug]**: Papan Kanban transparan tiga kolom (_Planned_, _In Progress_, _Completed_).
- **/changelog/[workspaceSlug]**: Timeline catatan rilis dengan tag kategori dan badge relasi penyelesaian request customer.

### Komponen Terpadu

- **`PortalHeader.svelte`**:
  - Sticky header dengan efek _backdrop-blur_.
  - Tab navigasi terpadu: **Feedback**, **Roadmap**, dan **Changelog** dengan indikator aktif yang jelas.
  - Slot actions dinamis (misal: tombol aksi _"+ Kirim Ide"_).
- **`PortalFooter.svelte`**:
  - Branding halus _"Didukung oleh Katauser — Platform Masukan Pengguna & AI"_.

---

## 5. Post Merging & Vote on Behalf

### Post Merging (Deduplikasi Feedback)
- Menggabungkan post duplikat (*source*) ke post utama (*target*) dengan soft-merge (`status = 'merged'`, `mergedIntoPostId = targetId`).
- Voter unik dipindahkan tanpa duplikasi suara, total MRR dan skor bobot dikalkulasi ulang secara otomatis.
- Catatan audit disematkan secara otomatis di thread komentar post target.
- Proteksi terhadap circular merge dan self-merge.
- Endpoint: `POST /api/v1/posts/:postId/merge`.

### Vote on Behalf (Atas Nama Klien B2B)
- Memungkinkan tim Sales/CS mencatatkan suara atas nama customer dengan MRR traits langsung dari dashboard admin.
- Upsert otomatis profil customer di tabel `end_users`.
- Endpoint: `POST /api/v1/posts/:postId/vote-on-behalf`.

---

## 6. Integrasi Linear Issue Tracker

Menghubungkan post masukan pengguna dengan tiket kerja engineering di Linear secara bilateral.

### Fitur Utama
- **Link Linear Issue**: Menghubungkan ID post dengan identifier issue Linear (misal `KAT-42`).
- **Webhook Sync Handler**: Menerima event update status dari Linear (misal tiket bergeser ke `Done` / `Completed` di Linear) lalu otomatis memperbarui status post Katauser ke `completed` dan memberi tahu voter.
- **Detached Isolation**: Perubahan di Linear tidak akan merusak integritas post lokal Katauser jika webhook terputus.

---

## 7. In-App Changelog Popover & Unread Badge

Komponen widget interaktif untuk mengumumkan rilis produk baru langsung di aplikasi induk.

### Fitur Utama
- **Floating Popover Teaser**: Muncul secara non-intrusif di atas launcher widget saat ada rilis baru yang belum pernah dilihat oleh user.
- **Unread Badge Dinamis**: Indikator unread count di launcher button dan tab navigasi changelog widget.
- **Hybrid Local Storage State**: Menyimpan timestamp pembacaan terakhir (`katauser_changelog_seen_<workspaceId>`) di browser untuk performa instan tanpa delay DB.
- **Auto Mark-as-Read**: Otomatis mereset status unread saat popover diklik atau tab changelog dibuka.
- **Endpoint API**: `GET /api/v1/workspaces/:slug/changelogs/latest?since=<ISO_DATE>`.

---

## 8. Native Model Context Protocol (MCP) Server & CLI Bridge

Menghubungkan AI coding agent (Cursor, Claude Code, Antigravity, Windsurf) langsung dengan Katauser melalui arsitektur hybrid.

### Arsitektur
- **Remote Hono API (`apps/api`)**: Endpoint `/api/v1/mcp/tools` dengan autentikasi API Key bertoken `ku_live_...` (di-hash SHA-256 pada database).
- **Executable CLI STDIO Bridge (`packages/mcp`)**: Package `@katauser/mcp` yang dapat dieksekusi instan via `npx -y @katauser/mcp`.
- **Daftar Tools V1**:
  - `list_feedback`: Mengambil daftar feedback dengan filter status, sorting popularitas/MRR.
  - `get_feedback_details`: Membaca detail post, komentar, voter, dan tiket Linear terhubung.
  - `create_feedback`: Membuat post masukan baru langsung dari percakapan AI.
  - `update_post_status`: Mengubah status workflow (`planned`, `in_progress`, `completed`, `closed`).
  - `get_roadmap_kanban`: Mengambil ringkasan roadmap 3 kolom.
  - `create_changelog_release`: Mempublikasikan catatan rilis changelog baru sekaligus menautkan post yang diselesaikan.
- **Keamanan & Guard**:
  - Penegakan izin granular (`read` vs `write`).
  - Validasi ketat batas tenant/workspace pada relational ID (`postIds`).
  - Pesan error Zod yang ramah bagi AI assistant untuk self-correction.

---

## 9. Ringkasan Pengujian & Linting

Seluruh modul dilengkapi dengan automated unit tests di Vitest:

- `@katauser/db`: `tests/seed.test.ts`, `tests/schema.test.ts`, `tests/feedback-repo.test.ts`, `tests/changelog-repo.test.ts`, `tests/chat-repo.test.ts`, `tests/api-keys.test.ts`.
- `@katauser/shared`: `tests/mcp-schemas.test.ts`, `tests/feedback-schemas.test.ts`, dll.
- `@katauser/api`: `tests/mcp-auth.test.ts`, `tests/mcp-tools.test.ts`, `tests/feedback.test.ts`, `tests/integrations.test.ts`.
- `@katauser/mcp`: `tests/stdio-bridge.test.ts`.
- `@katauser/web`: `tests/dashboard-hub.test.ts`, `tests/widget-generator.test.ts`, `tests/public-portal.test.ts`, `tests/landing-page.test.ts`, dll.
- `@katauser/widget`: `tests/changelog-popover.test.ts`, `tests/widget.test.ts`.

Perintah verifikasi monorepo:

```bash
# Menjalankan seluruh test suite
pnpm test

# Menjalankan typecheck & svelte diagnostics
pnpm check

# Menjalankan full monorepo build
pnpm build
```
