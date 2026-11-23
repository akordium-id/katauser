# Spesifikasi Desain: In-App Changelog Popover & Unread Badge (Katauser)

**Tanggal:** 23 November 2026  
**Status:** In Review / Proposed  
**Penulis:** Antigravity & Faiq (Akordium Lab)  
**Target Rilis:** Katauser v0.5.0  

---

## 1. Ringkasan Eksekutif & Latar Belakang

Pada produk B2B SaaS dan platform feedback modern (seperti Canny, Beamer, dan Featurebase), mendistribusikan pembaruan produk (_product releases / changelog_) ke pengguna aktif di dalam aplikasi web (*in-app*) secara non-intrusif sangat meningkatkan adopsi fitur dan kepuasan pengguna.

Komponen embed `<katauser-widget>` saat ini sudah memiliki tab `ChangelogTab` dan pill counter badge pada `<TriggerButton>`, namun belum memiliki:
1. Pengecekan otomatis rilis changelog terbaru dari API.
2. Mekanisme penghitungan status belum dibaca (*unread count*).
3. **In-App Changelog Popover** (floating teaser card yang melayang di atas trigger button untuk mengumumkan rilis baru).
4. Persistensi status baca (*read-state tracking*) yang bekerja instan baik untuk pengguna tamu/anonim (*localStorage*) maupun tersinkronisasi untuk pengguna teridentifikasi (*server sync*).

Dokumen ini mendefinisikan arsitektur teknis, antarmuka Web Component, endpoint API Hono, dan alur interaksi pengguna.

---

## 2. Arsitektur & Pilihan Desain yang Disepakati

### 2.1. Read-State Persistence: Opsi A (Hybrid Client-Side LocalStorage + Server Sync)
* **Penyimpanan Lokal (Default)**:
  * Key browser: `katauser_changelog_seen_<workspace>` menyimpan ISO timestamp `lastSeenPublishedAt` rilis terakhir yang sudah dilihat.
  * *Zero database latency*: Pengecekan status baca tidak membebani database utama untuk setiap page reload aplikasi induk.
  * Bekerja mulus bagi pengunjung anonim tanpa memerlukan session/login.
* **Sinkronisasi Server (Ketika Teridentifikasi)**:
  * Jika aplikasi memanggil `Katauser.identify({ userId, email })`, timestamp baca disinkronkan ke atribut `metadata.lastSeenChangelogAt` pada entitas `end_users`.

### 2.2. Visual & Interaksi UI (Shadow DOM)
* **Floating Teaser Popover (`<ChangelogPopover>`)**:
  * Diposisikan tepat di atas `<TriggerButton>` (`bottom: 92px`, `right: 24px` atau `left: 24px`).
  * Tampil hanya jika:
    1. Widget panel sedang tertutup (`!isOpen`).
    2. Ada rilis changelog belum dibaca (`unreadCount > 0`).
    3. Popover untuk rilis tersebut belum di-*dismiss* pada sesi berjalan (`!isDismissed`).
  * Menampilkan:
    * Label "Pembaruan Baru" (atau tag versi rilis seperti `v1.2.0`).
    * Judul rilis dan ringkasan 2 baris teks.
    * Tombol dismiss `✕` (menutup teaser tanpa menandai rilis sebagai dibaca).
    * Tombol CTA *"Lihat Rilis Baru →"* (langsung membuka panel widget ke tab `changelog`).
* **Unread Badge pada Trigger Button (`<TriggerButton>`)**:
  * Lingkaran badge merah/oranye di pojok kanan atas launcher menampilkan angka `unreadCount` (misal: `1`).
  * Otomatis hilang (`unreadCount = 0`) ketika user membuka panel widget atau berpindah ke tab `changelog`.

---

## 3. Desain Endpoint API (`apps/api`)

### 3.1. Endpoint Latest & Unread Changelog
* **URL**: `GET /api/v1/workspaces/:slug/changelogs/latest`
* **Query Parameters**:
  * `since` (opsional, string ISO Date): Timestamp rilis terakhir yang dilihat klien.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "latest": {
      "id": "ch_release_123",
      "workspaceId": "acme",
      "title": "v1.2.0 - Public Roadmap & Post Merging",
      "slug": "v1-2-0-public-roadmap",
      "content": "Kami baru saja meluncurkan integrasi roadmap publik dan deduplikasi masukan...",
      "publishedAt": "2026-11-23T10:00:00.000Z"
    },
    "unreadCount": 1,
    "hasUnread": true
  }
  ```
* **Logika Perhitungan**:
  * Jika parameter `since` kosong atau tidak valid, `unreadCount` dihitung sebagai jumlah total rilis changelog yang sudah dipublikasikan (atau dibatasi maksimal 5).
  * Jika `since` disertakan, `unreadCount` menghitung jumlah rilis yang memiliki `publishedAt > since`.

---

## 4. Desain Modul Widget Client SDK (`packages/widget`)

### 4.1. Ekstensi `globalWidgetState` (`packages/widget/src/sdk.ts`)
Tambahkan field dan method baru pada state manager:
```ts
export interface ChangelogSummary {
  id: string
  title: string
  slug: string
  content: string
  publishedAt: string
}

export interface WidgetState {
  // Existing fields
  isOpen: boolean
  activeTab: WidgetTab
  unreadCount: number
  workspaceId: string | null
  apiUrl: string
  user: WidgetUser | null

  // New fields
  latestChangelog: ChangelogSummary | null
  isPopoverDismissed: boolean
  showPopover: boolean

  // New methods
  setLatestChangelog(rel: ChangelogSummary | null): void
  dismissPopover(): void
  markChangelogAsRead(workspace: string, publishedAt: string): void
  syncChangelogStatus(workspace: string, apiUrl: string): Promise<void>
}
```

### 4.2. Helper Utilitas `changelog-helpers.ts` (`packages/widget/src/changelog-helpers.ts`)
* `getStoredLastSeenDate(workspace: string, storage?: Storage): string | null`
* `storeLastSeenDate(workspace: string, dateIso: string, storage?: Storage): void`
* `calculateUnreadCount(releases: Array<{ publishedAt?: string }>, sinceDate?: string | null): number`
* `shouldDisplayPopover(params: { isOpen: boolean, unreadCount: number, isDismissed: boolean, showPopover: boolean }): boolean`

### 4.3. Komponen Svelte 5 Baru: `ChangelogPopover.svelte`
* Menggunakan Svelte 5 runes (`$props()`).
* Terisolasi di dalam Web Component Shadow DOM sehingga tidak terdistorsi oleh CSS halaman host.
* Memiliki animasi halus fade-in dan slide-up saat muncul.
* Accessible: tombol close memiliki `aria-label="Tutup pemberitahuan"`, container memiliki `role="status"` atau `aria-live="polite"`.

---

## 5. Web Component Integration (`KatauserWidget.svelte`)

Menambahkan atribut kustom opsional:
```html
<katauser-widget
  workspace="acme"
  api-url="https://api.katauser.com"
  show-popover="true"
></katauser-widget>
```
Lifecycle widget:
1. Saat mount, panggil `syncChangelogStatus(workspace, apiUrl)` di `$effect`.
2. Jika ada rilis baru, set `unreadCount` dan render `<ChangelogPopover>`.
3. Saat tab `changelog` aktif atau tombol popover *"Lihat Rilis"* diklik:
   * Buka panel dan arahkan ke tab `changelog`.
   * Jalankan `markChangelogAsRead(workspace, latest.publishedAt)`.
   * `unreadCount` otomatis ter-update ke 0.

---

## 6. Strategi Pengujian (Test-Driven Development)

1. **Unit Test API (`apps/api/tests/changelog-unread.test.ts`)**:
   * Uji coba endpoint `GET /workspaces/:slug/changelogs/latest`:
     * Mengembalikan rilis terbaru.
     * Menghitung `unreadCount` dengan benar saat query `?since=...` diberikan.
     * Mengembalikan `unreadCount = 0` jika `since` lebih baru atau sama dengan `publishedAt`.
2. **Unit Test Widget Helpers (`packages/widget/tests/changelog-helpers.test.ts`)**:
   * Validasi fungsi `getStoredLastSeenDate`, `storeLastSeenDate`, `calculateUnreadCount`, dan `shouldDisplayPopover`.
3. **Widget State & Popover Tests (`packages/widget/tests/changelog-popover.test.ts`)**:
   * Verifikasi transisi state: `markChangelogAsRead` mereset `unreadCount` dan menyimpan ke storage.
   * `dismissPopover` menutup popover tanpa menghapus badge unread.
