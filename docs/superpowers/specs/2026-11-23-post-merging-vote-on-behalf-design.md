# Spesifikasi Desain: Post Merging & Vote on Behalf (Katauser)

**Tanggal:** 23 November 2026  
**Status:** In Review / Proposed  
**Penulis:** Antigravity & Faiq (Akordium Lab)  
**Target Rilis:** Katauser v0.4.0  

---

## 1. Ringkasan Eksekutif & Latar Belakang

Dalam platform manajemen feedback pengguna seperti Canny, Featurebase, dan UserJot, ada dua fitur krusial yang dibutuhkan oleh tim produk dan B2B SaaS:
1. **Post Merging (Deduplikasi Feedback)**: Pengguna seringkali mengirimkan ide atau keluhan yang sama dengan kata-kata berbeda (misalnya *"Dark mode please"*, *"Fitur mode gelap"*, *"Night theme"*). Admin perlu menggabungkan postingan duplikat ke dalam satu postingan utama tanpa menghilangkan data pemilih (*voters*) dan dampak revenue (*MRR*).
2. **Vote on Behalf (Voting atas nama Customer B2B)**: Tim Sales, Customer Success (CS), dan Support sering menerima masukan fitur penting saat berinteraksi langsung dengan klien enterprise melalui telepon, meeting, atau live chat. Admin/tim internal harus dapat mencatatkan masukan atas nama pelanggan tersebut beserta estimasi MRR dan catatan internal, tanpa memaksa pelanggan membuka portal feedback secara mandiri.

Dokumen ini mendefinisikan arsitektur teknis, perubahan skema database, antarmuka API, validasi data, mitigasi edge case, dan antarmuka pengguna untuk kedua kapabilitas tersebut.

---

## 2. Pilihan Arsitektur yang Disepakati

Berdasarkan kesepakatan desain:
* **Post Merging: Opsi A (Soft Merge dengan `mergedIntoPostId`)**
  * Post sumber (*source post*) tetap dipertahankan di database dengan status `'merged'` dan foreign key `mergedIntoPostId` yang mengarah ke post target (*target post*).
  * Pemilih (*voters*) dari post sumber dipindahkan/di-upsert ke post target secara deduplikasi (jika pemilih sudah pernah memilih di post target, vote tidak dihitung ganda).
  * `votesCount` dan `totalMrr` pada post target dihitung ulang secara atomik.
  * Tautan publik ke post sumber tidak 404, melainkan menampilkan banner informatif bahwa post telah digabungkan ke post target disertai tautan langsung (atau HTTP 301/302).
  * Audit trail dan kemungkinan pembatalan (*unmerge*) di masa mendatang tetap terjaga.
* **Vote on Behalf: Opsi 1 (End-User Upsert + Admin Attribution)**
  * Admin menginput email customer, nama (opsional), estimasi MRR/Plan (opsional), dan catatan internal (opsional).
  * Sistem melakukan *upsert* data customer pada tabel `end_users` sesuai `workspaceId`.
  * Vote dicatat di tabel `votes` dengan mereferensikan `endUserId`, serta mencatat `votedByTeamUserId` (ID staf/admin penginput) dan `internalNote`.
  * Langsung terintegrasi dengan penghitungan metrik revenue impact (`calculateRevenueImpact` / `totalMrr`).

---

## 3. Perubahan Skema Database (Drizzle ORM)

### 3.1. Skema `packages/db/src/schema/feedback.ts`

#### Tabel `posts`:
Menambahkan kolom `mergedIntoPostId`:
```ts
export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  endUserId: text("end_user_id").references(() => endUsers.id, {
    onDelete: "set null",
  }),
  teamUserId: text("team_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").default("pending").notNull(), 
  // Status: pending, under_review, planned, in_progress, completed, shipped, closed, merged
  mergedIntoPostId: text("merged_into_post_id"), // Self-referencing FK ke posts.id
  votesCount: integer("votes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
```

#### Tabel `votes`:
Menambahkan atribusi staf/admin dan catatan internal:
```ts
export const votes = pgTable(
  "votes",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    endUserId: text("end_user_id")
      .notNull()
      .references(() => endUsers.id, { onDelete: "cascade" }),
    votedByTeamUserId: text("voted_by_team_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    internalNote: text("internal_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_end_user_vote_unique").on(table.postId, table.endUserId),
  ],
)
```

---

## 4. Skema Validasi Shared (`packages/shared`)

### 4.1. Status Post
Menambahkan status `"merged"` ke daftar status yang valid:
```ts
export const POST_STATUSES = [
  "pending",
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "shipped",
  "closed",
  "merged",
] as const
```

### 4.2. Skema Zod Input
```ts
// packages/shared/src/schemas/feedback.ts
export const mergePostsSchema = z.object({
  targetPostId: z.string().min(1, "Target Post ID wajib diisi"),
})

export const voteOnBehalfSchema = z.object({
  customerEmail: z.string().email("Format email customer tidak valid"),
  customerName: z.string().min(2, "Nama customer minimal 2 karakter").max(100).optional(),
  company: z.string().max(100).optional(),
  mrr: z.number().min(0, "MRR tidak boleh bernilai negatif").optional(),
  internalNote: z.string().max(1000, "Catatan maksimal 1000 karakter").optional(),
})

export type MergePostsInput = z.infer<typeof mergePostsSchema>
export type VoteOnBehalfInput = z.infer<typeof voteOnBehalfSchema>
```

---

## 5. Logika Bisnis & Edge Cases

### 5.1. Aturan Validasi Post Merging
1. **Self-Merge Guard**: `sourcePostId` tidak boleh sama dengan `targetPostId`. (HTTP 400: *"Tidak dapat menggabungkan post ke dirinya sendiri"*).
2. **Circular Merge Guard**: Jika `targetPost` berstatus `'merged'`, merge ditolak atau dialihkan ke root target asli. Post target harus berupa root post (`mergedIntoPostId == null`). (HTTP 400: *"Target post sudah digabungkan ke post lain"*).
3. **Workspace Isolation**: Kedua post harus berada di workspace yang sama.
4. **Already Merged Guard**: Post sumber yang sudah berstatus `'merged'` tidak dapat digabungkan lagi tanpa unmerge terlebih dahulu.
5. **Deduplikasi Vote**:
   - Ambil seluruh voter dari post sumber.
   - Untuk setiap voter, cek apakah voter tersebut sudah memberikan vote di post target.
   - Jika belum, pindahkan vote ke target post (`postId = targetPostId`).
   - Jika sudah ada, hapus record vote dari post sumber agar tidak melanggar unique constraint `(postId, endUserId)`.
6. **Kalkulasi Ulang**:
   - `targetPost.votesCount = jumlah voter unik`.
   - `targetPost.totalMrr = sum(voter.traits.mrr)`.
   - `sourcePost.votesCount = 0` (atau ditandai non-aktif).
   - `sourcePost.status = 'merged'`.
   - `sourcePost.mergedIntoPostId = targetPostId`.
7. **Pemberitahuan Komentar**:
   - Buat komentar internal otomatis di post target: *"Post '[Judul Source Post]' telah digabungkan ke post ini beserta [N] voter."*

### 5.2. Aturan Validasi Vote on Behalf
1. **Autentikasi Staf**: Hanya pengguna tim yang terautentikasi (`teamUserId` / admin / member workspace) yang diizinkan memanggil endpoint ini.
2. **Upsert End User**:
   - Cari `end_users` berdasarkan `workspaceId` dan `email`.
   - Jika belum ada, buat record baru di `end_users` dengan `email`, `name`, dan `metadata: { mrr, company }`.
   - Jika sudah ada dan parameter MRR/Company dikirimkan, perbarui metadata tersebut.
3. **Duplikasi Vote**:
   - Jika customer (`endUserId`) sudah pernah vote di post ini, tolak dengan pesan jelas (HTTP 409 Conflict: *"Customer [email] sudah memberikan vote pada post ini"*).
4. **Pencatatan Vote**:
   - Insert ke tabel `votes` dengan `endUserId`, `votedByTeamUserId`, dan `internalNote`.
   - Tambah `votesCount` dan sesuaikan `totalMrr` post.

---

## 6. Desain Endpoint API (`apps/api`)

### 6.1. Endpoint Merge Post
* **URL**: `POST /api/v1/posts/:postId/merge`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "targetPostId": "post_target123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Post berhasil digabungkan",
    "targetPost": {
      "id": "post_target123",
      "title": "Fitur Dark Mode",
      "votesCount": 15,
      "totalMrr": 4500,
      "status": "planned"
    },
    "mergedVotesCount": 4,
    "mergedMrr": 1200
  }
  ```

### 6.2. Endpoint Vote on Behalf
* **URL**: `POST /api/v1/posts/:postId/vote-on-behalf`
* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
  ```json
  {
    "customerEmail": "budi@perusahaan.co.id",
    "customerName": "Budi Hartono",
    "company": "PT Maju Terus",
    "mrr": 500,
    "internalNote": "Diminta saat demo sales Q4. Prioritas tinggi untuk renewal."
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Vote atas nama customer berhasil dicatat",
    "post": {
      "id": "post_123",
      "votesCount": 8,
      "totalMrr": 2500
    },
    "vote": {
      "id": "vote_abc",
      "endUserId": "user_end_xyz",
      "customerEmail": "budi@perusahaan.co.id",
      "votedByTeamUserId": "user_admin_1",
      "internalNote": "Diminta saat demo sales Q4..."
    }
  }
  ```

---

## 7. Desain Antarmuka Pengguna (Web UI)

### 7.1. Komponen `MergePostModal.svelte`
* Modal interaktif yang dapat dibuka dari tombol aksi di daftar post/boards.
* Fitur pencarian target post yang memanfaatkan AI semantic search / similar posts (`POST /boards/:boardId/posts/similar`) untuk langsung menyarankan kandidat duplikat.
* Indikator preview perubahan: menampilkan jumlah voter yang akan dipindahkan dan potensi kenaikan MRR.
* Tombol konfirmasi merah/peringatan dengan konfirmasi teks: *"Gabungkan Post"*.

### 7.2. Komponen `VoteOnBehalfModal.svelte`
* Form modal yang ringkas:
  * Input Email Customer (wajib)
  * Input Nama Customer & Nama Perusahaan (opsional)
  * Input Nilai MRR dalam USD/IDR (opsional)
  * Textarea Catatan Internal / Quote feedback (opsional)
* Menampilkan badge feedback real-time saat berhasil disimpan.

### 7.3. Public Post Banner (Jika Post Merged)
* Di halaman publik board / post view, jika pengunjung membuka post dengan status `merged`:
  * Tampilkan alert banner informatif:
    > **Postingan ini telah digabungkan**  
    > Masukan ini telah digabungkan ke: **[Judul Post Target]** (12 votes). Semua perkembangan status akan dilaporkan pada post utama tersebut.
  * Tombol CTA: *"Buka Postingan Utama →"*

---

## 8. Strategi Pengujian (Test-Driven Development)

1. **Unit Test Repository (`packages/db/tests/merge-and-vote-behalf.test.ts`)**:
   * Uji coba fungsi `mergePosts`: pemindahan voter tanpa duplikasi, kalkulasi ulang `votesCount`, perubahan status ke `'merged'`, dan pencegahan self-merge.
   * Uji coba fungsi `voteOnBehalf`: upsert customer `end_users`, pembuatan vote dengan `votedByTeamUserId`, dan penolakan double vote.
2. **Unit Test Schemas (`packages/shared/tests/merge-behalf-schemas.test.ts`)**:
   * Validasi Zod untuk payload `mergePostsSchema` dan `voteOnBehalfSchema`.
3. **Integration Test API (`apps/api/tests/merge-and-vote-behalf.test.ts`)**:
   * Uji coba endpoint Hono `POST /posts/:postId/merge` dan `POST /posts/:postId/vote-on-behalf` dengan skenario sukses dan skenario error (400 self-merge, 404 not found, 409 conflict).
4. **Web UI Tests (`apps/web/tests/merge-behalf-ui.test.ts`)**:
   * Helper & validasi state untuk komponen modal Svelte 5.
