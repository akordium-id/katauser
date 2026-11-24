# Panduan Fitur: Chat-to-Feedback Bridge di Juno AI (Katauser)

Dokumen ini menjelaskan arsitektur, spesifikasi teknis, dan alur kerja fitur **Chat-to-Feedback Bridge** di asisten AI Juno pada Katauser.

---

## 1. Ikhtisar & Nilai Pembeda ala UserJot

Pada platform feedback konvensional (seperti Canny atau Featurebase), modul _live chat support_ dan _feedback board/roadmap_ beroperasi secara terpisah (silo). Ketika customer menyampaikan ide atau kendala di dalam chat, percakapan tersebut sering kali mengendap di inbox CS tanpa pernah tercatat di backlog produk, atau memaksa agen CS menyalinnya secara manual.

Katauser menghadirkan **Chat-to-Feedback Bridge**—fitur pembeda utama (_killer differentiator_) yang terinspirasi oleh inovasi modern seperti **UserJot**:

1. **Deduplikasi & Rekomendasi Roadmap Otomatis**: Saat customer mengutarakan kebutuhan fitur di live chat, Juno secara cerdas mendeteksi apakah ide serupa sudah ada di roadmap (`similarityScore >= 0.70`). Jika ada, Juno langsung menyajikan kartu interaktif **1-Click Upvote** di dalam obrolan.
2. **Auto-Create Feedback Post**: Jika ide tersebut belum pernah diajukan (`similarityScore < 0.70`), Juno menawarkan pembuatan draf masukan baru secara otomatis ke papan feedback publik yang sesuai, tanpa memaksa pengguna meninggalkan tab obrolan.
3. **Konversi Pengunjung Anonim (Closed-Loop Feedback)**: Pengunjung guest dapat langsung memasukkan email mereka secara inline pada kartu aksi. Dengan demikian, mereka otomatis terdaftar sebagai voter dan menerima notifikasi email saat fitur tersebut mulai dikerjakan atau dirilis.

---

## 2. Arsitektur Sistem & Alur SSE Streaming

Sistem ini mengadopsi pola _Single Stream Response with Structured SSE Action Card_:

```text
[ Pengguna di Widget (<katauser-widget>) ]
                 │
                 │ 1. POST /api/v1/chat/conversations/:id/juno-stream { prompt }
                 ▼
       [ Hono API (apps/api) ]
                 │
                 ├─ A. Cek Eskalasi Manusia (/manusia|human|staf|admin/i)
                 │
                 ├─ B. Cek Intent Feedback (isFeedbackIntent)
                 │     │
                 │     ├── [BUKAN FEEDBACK] ──► Query Basis Pengetahuan RAG (Docs/FAQ)
                 │     │
                 │     └── [FEEDBACK DETECTED]
                 │            │
                 │            ▼
                 │        generateEmbedding(prompt) -> 1536-dim vector
                 │            │
                 │            ▼
                 │        Hitung Cosine Similarity vs Postingan Aktif di Workspace
                 │            │
                 │            ├─ Skor Tertinggi >= 0.70 ──► Action: "similar_post"
                 │            └─ Skor Tertinggi < 0.70  ──► Action: "create_feedback"
                 │
                 ▼
       [ Aliran Server-Sent Events (SSE) ]
         data: {"text": "Halo! Terima kasih atas sarannya..."}
         data: {"text": " Kami menemukan ide serupa..."}
         data: {"action": { "type": "similar_post", ... }}
         data: [DONE]
                 │
                 ▼
[ MessagesTab.svelte di Shadow DOM Widget ]
                 │
                 ├─ Render Gelembung Pesan Teks Juno
                 └─ Render Kartu Aksi Interaktif (Similar Post / Create Feedback)
                         │
                         ├─ [Guest]: Input email validasi inline
                         └─ [Identified]: 1-Klik Instan
                                 │
                                 ▼ (Submit Action)
               POST /api/v1/posts/:id/vote  ATAU  POST /api/v1/boards/:id/posts
                                 │
                                 ▼
                     Kartu -> actionResolved: true
                     Juno Menambahkan Konfirmasi di Chat
```

---

## 3. Deteksi Intent & Kalkulasi Kemiripan Semantik

### 3.1 Deteksi Intent Feedback (`isFeedbackIntent`)

Backend API mengevaluasi setiap pesan pengguna menggunakan pola intent multibahasa (Indonesia & Inggris) untuk membedakan saran fitur dari pertanyaan bantuan biasa:

```typescript
// apps/api/src/modules/chat/chat.route.ts
export function isFeedbackIntent(prompt: string): boolean {
  // Abaikan pertanyaan seputar dokumentasi atau cara pemakaian (RAG biasa)
  if (/^(bagaimana cara|how to|cara pakai|apa itu|what is)/i.test(prompt)) {
    return false
  }

  // Deteksi kata kunci fitur, ide, saran, usul, dan keluhan
  return /fitur|tolong buatkan|bisa tambahkan|usul|ide|saran|request|masukan|bug|kendala|error|tambah|update|bisa gak|bisa nggak|fitur baru|feature/i.test(
    prompt,
  )
}
```

### 3.2 Filtering Postingan Aktif

Pencarian kemiripan kosinus hanya mengevaluasi postingan dalam status aktif di workspace yang sama:

- **Diikutsertakan**: `open`, `under_review`, `planned`, `in_progress`, `completed`.
- **Dikecualikan**: Postingan yang telah berstatus `closed` atau telah digabungkan (`merged` / memiliki `mergedIntoPostId`). Hal ini mencegah pengguna meng-upvote ide yang sudah ditolak atau duplikat usang.

### 3.3 Ambang Batas Kemiripan (_Threshold_)

1. **`similarityScore >= 0.70` (Ide Serupa Ditemukan)**:
   - Juno memilih postingan aktif dengan skor kemiripan tertinggi.
   - Mengirimkan chunk aksi `{ type: "similar_post", post: {...}, similarityScore }`.
   - Pesan Juno menyapa pengguna dengan ramah dan menanyakan apakah mereka ingin memberikan upvote ke post yang sudah ada.
2. **`similarityScore < 0.70` atau Belum Ada Postingan (Ide Baru)**:
   - Juno mendeteksi board publik utama di workspace (board dengan slug `fitur` atau board aktif pertama).
   - Menghasilkan draf judul singkat melalui `extractFeedbackTitle(prompt)`.
   - Mengirimkan chunk aksi `{ type: "create_feedback", boardId, boardSlug, draft: { title, content } }`.
   - Pesan Juno menawarkan pendaftaran ide baru langsung ke feedback board.

---

## 4. Kontrak Data & Skema (`@katauser/shared`)

Semua payload divalidasi secara ketat menggunakan Zod schema:

```typescript
// packages/shared/src/schemas/chat.ts
export const junoSimilarPostActionSchema = z.object({
  type: z.literal("similar_post"),
  post: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    content: z.string(),
    votesCount: z.number().int().nonnegative(),
    status: z.enum([
      "open",
      "under_review",
      "planned",
      "in_progress",
      "completed",
      "closed",
    ]),
    boardSlug: z.string().min(1),
  }),
  similarityScore: z.number().min(0).max(1),
})

export const junoCreateFeedbackActionSchema = z.object({
  type: z.literal("create_feedback"),
  boardId: z.string().min(1),
  boardSlug: z.string().min(1),
  draft: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
})

export const junoActionPayloadSchema = z.discriminatedUnion("type", [
  junoSimilarPostActionSchema,
  junoCreateFeedbackActionSchema,
])
```

---

## 5. Panduan Integrasi & Perilaku Widget (`<katauser-widget>`)

Widget Katauser secara otomatis merender kartu aksi interaktif di bawah gelembung obrolan Juno ketika chunk bertipe `action` diterima.

### 5.1 Alur Pengguna Terotentikasi (_Identified User_)

Jika aplikasi induk telah memanggil `Katauser.identify({ userId, email, ... })`:

- Pengguna **tidak perlu** menginput email lagi.
- Tombol aksi menampilkan aksi instan: `[ +1 Upvote ]` atau `[ Kirim ke Feedback Board ]`.
- Sekali klik langsung memicu request ke backend dengan identitas pengguna terverifikasi.

### 5.2 Alur Pengunjung Anonim (_Guest User_)

Jika pengguna belum teridentifikasi:

- Kartu menampilkan input email inline: `[ Masukkan email Anda... ]`.
- Validasi regex sisi klien memastikan format email valid sebelum request dikirim.
- Jika email kosong atau salah ketik, peringatan merah muncul secara instan (`"Email wajib diisi untuk notifikasi"`).

### 5.3 Transisi State & Konfirmasi Percakapan

- Saat proses pengiriman berjalan, tombol masuk ke status `isActionSubmitting` (disabled & menampilkan spinner indikator).
- Proteksi idempotensi: setelah aksi berhasil dieksekusi, properti `message.actionResolved` diubah menjadi `true`.
- Kartu berganti tampilan menjadi badge hijau:
  - Untuk upvote: `✓ Upvote Anda telah ditambahkan`
  - Untuk create: `✓ Ide telah dikirim ke board`
- Juno secara otomatis mengirimkan pesan konfirmasi balasan ke dalam obrolan:
  - _Upvote_: _"Terima kasih! Suara Anda telah berhasil ditambahkan. Kami akan mengabari Anda jika ada pembaruan status pada fitur ini."_
  - _Create_: _"Saran Anda telah berhasil dikirim ke board masukan. Tim produk kami akan segera meninjaunya!"_
- Obrolan bergulir halus ke bawah (_auto-scroll_).

---

## 6. Mockup Visual Alur Interaksi Chat

### Skenario A: Rekomendasi Ide Serupa (`similar_post`)

```text
┌─────────────────────────────────────────────────────────────────┐
│ Juno AI                                                14:32    │
│                                                                 │
│ Kami menemukan ide serupa yang sudah tercatat di roadmap kami!  │
│ Apakah Anda ingin memberikan upvote untuk mendukung ide ini?    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💡 Ide Serupa di Roadmap               [ 88% Cocok ]        │ │
│ │                                                             │ │
│ │ Ekspor Laporan Transaksi ke Format CSV                      │ │
│ │ Status: [ Planned ]                      ▲ 54 votes         │ │
│ │                                                             │ │
│ │ [ Masukkan email Anda...             ] (Hanya untuk Guest)  │ │
│ │                                                             │ │
│ │ [ ▲ +1 Upvote Ide Ini                                     ] │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                ▼ (Setelah Pengguna Menekan Tombol Upvote)

┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Upvote Anda telah ditambahkan                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Juno AI                                                14:33    │
│ Terima kasih! Suara Anda telah berhasil ditambahkan. Kami akan │
│ mengabari Anda jika ada pembaruan status pada fitur ini.        │
└─────────────────────────────────────────────────────────────────┘
```

### Skenario B: Usulan Ide Baru ke Board (`create_feedback`)

```text
┌─────────────────────────────────────────────────────────────────┐
│ Juno AI                                                15:10    │
│                                                                 │
│ Ide atau masukan yang sangat bagus! Kami belum menemukan ide    │
│ serupa di roadmap kami. Apakah Anda ingin mendaftarkan ide ini? │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✨ Usulkan Ide Baru                          #fitur         │ │
│ │                                                             │ │
│ │ Integrasi Webhook WhatsApp                                  │ │
│ │ "Kirim notifikasi otomatis saat pesanan baru masuk ke WA"   │ │
│ │                                                             │ │
│ │ [ Masukkan email Anda...             ] (Hanya untuk Guest)  │ │
│ │                                                             │ │
│ │ [ Kirim ke Feedback Board                                 ] │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                ▼ (Setelah Pengguna Menekan Tombol Kirim)

┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Ide telah dikirim ke board                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Juno AI                                                15:11    │
│ Saran Anda telah berhasil dikirim ke board masukan. Tim produk  │
│ kami akan segera meninjaunya!                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Verifikasi & Pengujian Otomatis

Fitur ini diuji secara komprehensif di seluruh layer monorepo:

1. **`@katauser/shared` (`packages/shared/tests/chat-schemas.test.ts`)**:
   - Validasi struktur skema `similar_post` dan `create_feedback`.
   - Penolakan payload dengan tipe tidak dikenal.
2. **`@katauser/api` (`apps/api/tests/chat-feedback-bridge.test.ts`)**:
   - Rekomendasi kartu `similar_post` saat kemiripan prompt >= 0.70.
   - Rekomendasi kartu `create_feedback` saat prompt merupakan masukan baru (< 0.70).
   - Pengabaian post bertatus `closed` atau `merged`.
   - Zero-action emission untuk pertanyaan panduan/RAG biasa.
3. **`@katauser/widget` (`packages/widget/tests/chat-feedback-bridge.test.ts`)**:
   - Parsing chunk SSE JSON berformat aksi dengan atau tanpa prefix `data:`.
   - Backward compatibility untuk chunk pesan teks biasa.
   - Manajemen struktur state `ChatMessage` dengan atribut `action` dan `actionResolved`.
