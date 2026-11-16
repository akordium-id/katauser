# Dokumentasi Fitur & Alur Kerja Teknis Katauser

Dokumen ini merangkum arsitektur, modul utama, dan alur kerja teknis di monorepo Katauser yang telah diselesaikan.

---

## 1. Workspace Hub & Dashboard Admin

### Rute & Alur Navigasi
- **/account**: Berfungsi sebagai *Workspace Hub*. Menampilkan daftar workspace milik user, status plan (`Free` / `Pro`), jumlah board aktif, tombol akses cepat ke dashboard, dan tautan ke portal publik.
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
  - Mengelompokkan modul ke dalam dua grup utama: *Manajemen Produk* dan *Pengaturan*.
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
- **`packages/db/src/seed.ts`**: Runner CLI yang menjalankan operasi *idempotent upsert* (`onConflictDoUpdate` / `onConflictDoNothing`).

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
   - `fitur` (*Papan Ide & Fitur*).
   - `kendala` (*Laporan Kendala & Bug*).
5. **Feedback Posts (5 Post Nyata)**:
   - Integrasi Discord & Slack Webhook (`in_progress`, 54 votes).
   - Single Sign-On (SSO) SAML / Okta (`planned`, 38 votes).
   - Dukungan Tema Gelap di Widget Embed (`completed`, 29 votes).
   - Ekspor Masukan ke Format CSV & Excel (`under_review`, 16 votes).
   - Notifikasi Email Terlambat (`completed`, 7 votes).
6. **Changelog**:
   - Rilis publik v1.2.0 (*Dukungan Dark Mode di Widget & Optimasi Ukuran Bundle*).

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
- **/roadmap/[workspaceSlug]**: Papan Kanban transparan tiga kolom (*Planned*, *In Progress*, *Completed*).
- **/changelog/[workspaceSlug]**: Timeline catatan rilis dengan tag kategori dan badge relasi penyelesaian request customer.

### Komponen Terpadu
- **`PortalHeader.svelte`**:
  - Sticky header dengan efek *backdrop-blur*.
  - Tab navigasi terpadu: **Feedback**, **Roadmap**, dan **Changelog** dengan indikator aktif yang jelas.
  - Slot actions dinamis (misal: tombol aksi *"+ Kirim Ide"*).
- **`PortalFooter.svelte`**:
  - Branding halus *"Didukung oleh Katauser — Platform Masukan Pengguna & AI"*.

---

## 5. Ringkasan Pengujian & Linting

Seluruh modul dilengkapi dengan automated unit tests di Vitest:
- `@katauser/db`: `tests/seed.test.ts`, `tests/schema.test.ts`, `tests/feedback-repo.test.ts`, `tests/changelog-repo.test.ts`, `tests/chat-repo.test.ts`.
- `@katauser/web`: `tests/dashboard-hub.test.ts`, `tests/widget-generator.test.ts`, `tests/public-portal.test.ts`, `tests/landing-page.test.ts`, dll.

Perintah verifikasi monorepo:
```bash
# Menjalankan seluruh test suite
pnpm test

# Menjalankan typecheck & svelte diagnostics
pnpm check

# Menjalankan full monorepo build
pnpm build
```
