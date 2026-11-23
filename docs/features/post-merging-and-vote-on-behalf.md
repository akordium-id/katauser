# Panduan Fitur: Post Merging & Vote on Behalf (Katauser)

Dokumen ini menjelaskan implementasi fitur **Post Merging (Deduplikasi Feedback)** dan **Vote on Behalf (Voting atas Nama Pelanggan B2B)** di Katauser.

---

## 1. Post Merging (Deduplikasi Feedback)

Saat pengguna mengirimkan feedback dengan topik yang serupa (misal: *"Dark mode please"* dan *"Fitur mode malam"*), admin dapat menggabungkan postingan duplikat (*source post*) ke postingan utama (*target post*).

### Karakteristik & Aturan Bisnis
- **Soft Merge Preservation**: Post asal tidak dihapus; statusnya diubah menjadi `'merged'` dengan kolom `mergedIntoPostId` yang mereferensikan post target.
- **Deduplikasi Pemilih (Voter Transfer)**:
  - Seluruh voter unik dari post asal dipindahkan ke post target.
  - Jika seorang user sudah pernah memberikan suara di post target, suara dari post asal tidak diduplikasi (menghindari double vote).
- **Konsolidasi Metrik**:
  - `votesCount` dan `totalMrr` pada post target dikalkulasikan ulang secara otomatis.
  - Komentar internal audit otomatis disematkan pada post target: *"Post '[Judul Asal]' was merged into this post with [N] voters."*
- **Guard Validasi**:
  - Self-merge dicegah (`sourceId !== targetId` -> HTTP 400).
  - Chained / circular merge dicegah (tidak dapat menggabungkan post ke target yang sudah berstatus `'merged'` -> HTTP 400).

### Endpoint API
- **URL**: `POST /api/v1/posts/:postId/merge`
- **Request Body**:
  ```json
  {
    "targetPostId": "post_target_id"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Post successfully merged",
    "targetPost": { ... },
    "transferredVotesCount": 3,
    "transferredMrr": 1200
  }
  ```

---

## 2. Vote on Behalf (Voting atas Nama Pelanggan B2B)

Fitur ini diperuntukkan bagi tim Sales, Customer Success (CS), dan Support untuk mencatatkan masukan pelanggan yang diterima langsung melalui meeting, panggilan telepon, atau chat tanpa memaksa klien membuka portal feedback.

### Karakteristik & Aturan Bisnis
- **Atribusi Customer (`end_users`)**:
  - Sistem melakukan *upsert* pada tabel `end_users` sesuai `workspaceId` dan `customerEmail`.
  - Profil customer diperkaya dengan atribut `mrr` dan `company`.
- **Atribusi Staf Tim**:
  - Tabel `votes` mencatat `votedByTeamUserId` (siapa anggota tim internal yang mencatatkan).
  - Mendukung `internalNote` untuk menyimpan kutipan atau konteks pembicaraan klien.
- **Dampak Revenue**:
  - Nilai MRR pelanggan langsung berkontribusi pada metrik `totalMrr` postingan dan dashboard prioritas roadmap.
- **Pencegahan Duplikasi**:
  - Jika pelanggan dengan email yang sama sudah pernah memilih post tersebut, API mengembalikan HTTP 409 Conflict.

### Endpoint API
- **URL**: `POST /api/v1/posts/:postId/vote-on-behalf`
- **Headers**:
  - `x-team-user-id`: ID anggota tim penginput
- **Request Body**:
  ```json
  {
    "customerEmail": "budi@perusahaan.co.id",
    "customerName": "Budi Hartono",
    "company": "PT Mega Sukses",
    "mrr": 1500,
    "internalNote": "Diminta saat quarterly renewal demo. Menjadi deal-breaker untuk paket enterprise."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Vote on behalf recorded",
    "post": {
      "id": "post_123",
      "votesCount": 9,
      "totalMrr": 4500
    },
    "vote": {
      "id": "vote_abc",
      "customerEmail": "budi@perusahaan.co.id",
      "votedByTeamUserId": "staff_1",
      "internalNote": "Diminta saat quarterly renewal demo..."
    }
  }
  ```

---

## 3. Komponen Antarmuka Pengguna (Web UI)

- **`MergePostModal.svelte`**: Modal admin untuk memilih target post tujuan dengan fitur filter pencarian, pratinjau kalkulasi penggabungan vote dan MRR, serta konfirmasi aman.
- **`VoteOnBehalfModal.svelte`**: Modal form cepat untuk tim CS/Sales memasukkan email pelanggan, perusahaan, MRR, dan catatan internal.
- **Public Portal Banner**: Menampilkan peringatan informatif pada postingan yang sudah tergabung (`status: merged`) untuk mengarahkan pengguna ke postingan utama.
