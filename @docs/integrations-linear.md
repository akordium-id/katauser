# Panduan Integrasi: Linear Issue Tracker Sync

Dokumen ini menjelaskan arsitektur dan langkah konfigurasi integrasi **Linear Issue Tracker** di Katauser untuk menghubungkan umpan balik pelanggan langsung ke alur kerja harian tim engineering.

---

## 1. Ikhtisar Alur Kerja (Workflow Overview)

```
[Customer Upvotes Ide] 
         │
         ▼
[Admin Katauser: "+ Buat Issue Linear"] ────► [Issue Terbuat di Linear (misal: ENG-142)]
                                                              │
                                                              ▼
                                                   [Developer Menyelesaikan Task di Linear]
                                                   [State: "Done" (type: completed)]
                                                              │
                                                              ▼
[Voter Terima Email Rilis] ◄──── [Post Status: "Completed"] ◄─ [Inbound Webhook Signature Valid]
```

1. **Push to Linear**: Admin dapat membuat issue baru di Linear langsung dari post Katauser atau menautkan issue yang sudah ada (`ENG-142`).
2. **Backlink Otomatis**: Setiap issue di Linear yang dibuat via Katauser otomatis memiliki backlink ke post Katauser.
3. **Execution Source of Truth**: Developer tidak perlu membuka Katauser. Saat issue di Linear dipindahkan ke state bertipe `completed` (Done), Linear mengirim webhook ke Katauser.
4. **Automated Closing & Voter Notification**: Status post di Katauser otomatis berganti menjadi `completed` dan seluruh voter otomatis menerima email notifikasi rilis fitur via Resend.

---

## 2. Langkah Konfigurasi (Setup Guide untuk Self-Host)

### Langkah A: Ambil Personal API Key di Linear
1. Buka aplikasi Linear dan masuk ke menu **Settings** (ikon gear di pojok kiri atas).
2. Pilih menu **My Account → Security & Access** atau langsung buka `https://linear.app/settings/api`.
3. Di bagian **Personal API Keys**, klik **New API Key**.
4. Beri label (misal: `Katauser Integration`) dan klik **Create**.
5. Salin API Key yang diawali dengan `lin_api_...`.

### Langkah B: Daftarkan Inbound Webhook di Linear
1. Di Linear, buka **Settings → Workspace → API → Webhooks** (`https://linear.app/settings/api/webhooks`).
2. Klik tombol **New Webhook**.
3. Masukkan **URL Webhook Katauser Anda**:
   ```text
   https://<domain-katauser-anda>/api/v1/integrations/linear/webhook/<workspaceSlug>
   ```
   *(Tautan ini juga dapat disalin langsung dari halaman Katauser Admin di `/settings/integrations`)*.
4. Pada pilihan event, centang **Issues**.
5. Klik **Create Webhook**.
6. Salin **Signing Secret** yang ditampilkan (biasanya diawali dengan `whsec_...` atau string acak).

### Langkah C: Simpan di Dashboard Admin Katauser
1. Masuk ke Dashboard Admin Katauser: `/dashboard/[workspaceSlug]/settings/integrations`.
2. Pada kartu **Linear Issue Tracker**, masukkan:
   - **Linear Personal API Key**: `lin_api_...`
   - **Webhook Signing Secret**: Secret dari langkah B.
3. Klik tombol **Hubungkan Linear**.
4. Sistem akan memverifikasi kredensial ke Linear API. Jika valid, badge akan berubah menjadi hijau: *"Terhubung ke organisasi: [Nama Organisasi Linear]"*.

---

## 3. Keamanan & Verifikasi Tanda Tangan (HMAC SHA-256)

Setiap request webhook dari Linear diverifikasi menggunakan algoritma **HMAC SHA-256**:
- Header `Linear-Signature` dicocokkan dengan hasil hashing raw body menggunakan webhook secret.
- Menggunakan fungsi `crypto.timingSafeEqual` untuk mencegah celah keamanan *timing attack*.
- Request dengan tanda tangan tidak valid ditolak dengan HTTP `401 Unauthorized`.

---

## 4. Idempotensi & Anti-Spam Notifikasi

Linear secara berkala melakukan *retry* jika koneksi jaringan sempat mengalami gangguan. Katauser memiliki *idempotency guard*:
- Jika status post Katauser sudah berstatus `completed`, pemrosesan webhook hanya memperbarui status baris `post_issues` tanpa mengirimkan email notifikasi duplikat ke para voter.

---

## 5. Struktur Tabel Terkait (`@katauser/db`)

- **`workspace_integrations`**: Menyimpan kredensial API Key dan Webhook Secret per tenant.
- **`post_issues`**: Menyimpan relasi multi-provider antara `posts` Katauser dengan identifier eksternal (`ENG-142`) beserta URL dan status terkini.
