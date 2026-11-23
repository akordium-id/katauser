# Panduan Fitur: In-App Changelog Popover & Unread Badge (Katauser)

Dokumen ini menjelaskan implementasi fitur **In-App Changelog Popover** dan **Unread Badge** pada paket embed widget `<katauser-widget>` di Katauser.

---

## 1. Ikhtisar & Arsitektur

Fitur ini memungkinkan pemilik aplikasi/produk SaaS untuk mengumumkan rilis baru langsung ke pengunjung atau pengguna aktif di aplikasi induk tanpa mengganggu alur kerja mereka.

### Karakteristik & Aturan Bisnis
- **Non-intrusif & Contextual**:
  - Popover teaser muncul melayang di atas tombol peluncur (`<TriggerButton>`) widget saat ada rilis changelog baru yang belum pernah dilihat oleh pengguna.
  - Kartu popover menampilkan nomor versi/tag (misal `v1.4.0`), judul changelog, kutipan ringkasan singkat, dan tombol ajakan bertindak (CTA *"Read changelog"*).
- **Unread Badge Dinamis**:
  - Badge angka merah (atau dot indikator) tampil pada tombol floating launcher `<TriggerButton>` dan tab navigasi **Changelog** di dalam widget modal.
- **Client-Side Read State (Hybrid Opsi A)**:
  - Menyimpan timestamp changelog terakhir yang dilihat di `localStorage` per workspace: `katauser_changelog_seen_<workspaceId>`.
  - Bekerja secara instan untuk pengunjung anonim/guest maupun pengguna terotentikasi tanpa latensi roundtrip database berlebih.
- **Dismiss & Auto-Mark As Read**:
  - Pengguna dapat menutup popover via tombol `x` (dismiss). Popover tidak akan muncul lagi untuk rilis yang sama selama sesi browser.
  - Mengklik kartu popover atau membuka tab Changelog di dalam modal widget akan otomatis memanggil `markChangelogAsRead()`, menyinkronkan timestamp ke `localStorage`, dan mereset `unreadCount` menjadi `0`.

---

## 2. Endpoint API

Endpoint disediakan oleh backend Hono API untuk mengambil rilis terbaru yang telah dipublikasikan (`status = 'published'`) dan menghitung jumlah unread changelogs sejak kunjungan terakhir.

### `GET /api/v1/workspaces/:slug/changelogs/latest`

- **URL**: `/api/v1/workspaces/:slug/changelogs/latest`
- **Method**: `GET`
- **Query Parameters**:
  - `since` *(opsional)*: String tanggal ISO 8601 (misal `2026-11-20T10:00:00.000Z`). Menghitung berapa banyak changelog yang dipublikasikan setelah tanggal ini.

#### Response (Saat ada rilis baru):
```json
{
  "success": true,
  "latest": {
    "id": "cl_12345",
    "version": "v1.4.0",
    "title": "Post Merging & Vote on Behalf",
    "content": "Kami baru saja meluncurkan deduplikasi feedback otomatis...",
    "publishedAt": "2026-11-23T04:00:00.000Z"
  },
  "unreadCount": 1,
  "hasUnread": true
}
```

#### Response (Saat belum ada changelog yang dipublikasikan):
```json
{
  "success": true,
  "latest": null,
  "unreadCount": 0,
  "hasUnread": false
}
```

---

## 3. Komponen & SDK Widget

Semua komponen berjalan di dalam **Shadow DOM Web Component** (`<katauser-widget>`) untuk isolasi style penuh dari aplikasi host.

### A. Helper Logic (`packages/widget/src/changelog-helpers.ts`)
Fungsi murni zero-dependency untuk interaksi storage dan kalkulasi:
- `getStoredLastSeenDate(workspaceId)`: Membaca timestamp dari `localStorage`.
- `storeLastSeenDate(workspaceId, date)`: Menyimpan tanggalISO ke `localStorage`.
- `calculateUnreadCount(lastSeen, publishedAt, serverUnreadCount)`: Mengkalkulasi unread secara reaktif.
- `shouldDisplayPopover(hasChangelog, isDismissed, isOpen, isRead)`: Logika penentu apakah kartu popover harus dirender.

### B. State Management (`packages/widget/src/sdk.ts`)
Ekstensi `globalWidgetState`:
- `latestChangelog`: Objek changelog terbaru dari server.
- `isPopoverDismissed`: Flag status apakah user menutup popover secara manual.
- `syncChangelogStatus(apiUrl, workspaceSlug, workspaceId)`: Memanggil endpoint server dan menginisialisasi unread count.
- `markChangelogAsRead(workspaceId, publishedAt)`: Memperbarui state lokal dan me-reset unread badge.
- `dismissPopover()`: Menutup popover sementara.

### C. Komponen UI (`packages/widget/src/components/ChangelogPopover.svelte`)
- Kartu mengambang dengan elevasi bayangan halus (`box-shadow`), animasi transisi fade/slide-up.
- Tombol close interaktif dan link action menuju tab changelog widget.
- Style murni terenkapsulasi dalam `:host` Shadow DOM pada koordinat `bottom: 92px`, `right: 24px`.

---

## 4. Contoh Penggunaan di Aplikasi Host

Cukup sematkan script widget Katauser seperti biasa. Widget secara otomatis melakukan polling status changelog saat mounted:

```html
<script 
  src="https://cdn.katauser.com/widget.js" 
  data-workspace="my-saas"
  defer>
</script>

<katauser-widget 
  workspace="my-saas" 
  api-url="https://api.katauser.com">
</katauser-widget>
```

Bila admin merilis changelog baru di dashboard Katauser, widget pengguna di host app akan otomatis memunculkan kartu teaser changelog dan indikator unread badge merah.
