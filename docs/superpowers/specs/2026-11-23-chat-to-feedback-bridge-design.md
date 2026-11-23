# Design Specification: Chat-to-Feedback Bridge di Juno AI

Tanggal: 2026-11-23  
Status: Draft (Pending Final User Review)  
Target Branch: `feat/chat-to-feedback-bridge`

---

## 1. Latar Belakang & Tujuan

Pada platform feedback modern seperti **UserJot (userjot.com)**, fitur pembeda utama (*killer differentiator*) dibanding Canny konvensional adalah integrasi mulus antara live chat asisten AI dan sistem feedback/roadmap (*Chat-to-Feedback Bridge*).

Saat ini di Katauser:
- Asisten AI **Juno** mampu menjawab pertanyaan seputar basis pengetahuan RAG dan mengeskalasi obrolan ke staf manusia jika diminta.
- Namun, jika customer menyampaikan ide fitur atau keluhan produk di tab Live Chat, masukan tersebut hanya berhenti di riwayat obrolan dan tidak terhubung ke papan feedback maupun roadmap produk.

### Tujuan Fitur
1. **Deduplikasi & Rekomendasi Roadmap Otomatis**: Ketika customer mengobrol tentang suatu kebutuhan fitur, Juno mendeteksi apakah ide serupa sudah ada di roadmap (`similarityScore >= 0.70`), lalu menawarkan kartu **1-Click Upvote** langsung di dalam bubble chat.
2. **Auto-Create Feedback Post**: Jika ide tersebut belum ada di roadmap (`similarityScore < 0.70`), Juno menawarkan untuk mendaftarkannya sebagai masukan baru ke board publik utama tanpa memaksa customer berganti tab.
3. **Konversi Pengunjung Anonim**: Menyediakan inline email capture bagi pengunjung guest agar mereka dapat menerima email notifikasi perkembangan fitur saat statusnya bergeser (Closed Loop Feedback).

---

## 2. Arsitektur & Alur Kerja Sistem

```text
[ Customer di Widget MessagesTab ]
              │
              │ POST /chat/conversations/:id/juno-stream { prompt }
              ▼
    [ apps/api: chat.route.ts ]
              │
              ├─ 1. Human Handoff Check (Regex)
              │
              ├─ 2. Feedback Intent Check (Regex/Keywords)
              │       │
              │       ▼
              │   [ ai-embeddings: generateEmbedding(prompt) ]
              │       │
              │       ▼
              │   [ Cosine Similarity vs Active Posts di Workspace ]
              │       │
              │       ├─ Match (Score >= 0.70) ────────┐
              │       │                                │
              │       └─ No Match (Score < 0.70) ──┐   │
              │                                    │   │
              ▼                                    ▼   ▼
       [ Normal RAG Text ]                 [ Generate SSE Action Card ]
              │                                    │
              └───────────────┬────────────────────┘
                              ▼
        [ SSE Stream: data: {"text": "..."} ]
        [ SSE Stream: data: {"action": {...}} ]
        [ SSE Stream: data: [DONE] ]
                              │
                              ▼
    [ Widget: Render Chat Bubble + Interactive Action Card ]
              │
              ├─ If Guest: Input email inline
              │
              ▼ [ Click Upvote / Submit ]
    [ Call POST /posts/:id/vote OR POST /boards/:id/posts ]
              │
              ▼
    [ Card State -> actionResolved: true ]
    [ Juno Appends Confirmation Message to Chat ]
```

---

## 3. Kontrak Data & Skema (`@katauser/shared`)

### 3.1 Tipe Aksi Juno (`packages/shared/src/schemas/chat.ts`)

```typescript
export type JunoActionType = "similar_post" | "create_feedback"

export interface JunoSimilarPostAction {
  type: "similar_post"
  post: {
    id: string
    title: string
    content: string
    votesCount: number
    status: "open" | "under_review" | "planned" | "in_progress" | "completed" | "closed"
    boardSlug: string
  }
  similarityScore: number
}

export interface JunoCreateFeedbackAction {
  type: "create_feedback"
  boardId: string
  boardSlug: string
  draft: {
    title: string
    content: string
  }
}

export type JunoActionPayload = JunoSimilarPostAction | JunoCreateFeedbackAction

export interface JunoStreamChunk {
  text?: string
  action?: JunoActionPayload
}
```

### 3.2 State Obrolan di Frontend (`packages/widget/src/chat-helpers.ts`)

```typescript
export interface ChatMessage {
  id: string
  sender: "user" | "juno" | "human"
  text: string
  time: string
  action?: JunoActionPayload
  actionResolved?: boolean
}
```

---

## 4. Spesifikasi Backend (`apps/api`)

### 4.1 Endpoint `POST /api/v1/chat/conversations/:id/juno-stream`

1. **Ekstraksi Konteks & Intent**:
   - Membaca `prompt` dari request body.
   - Pengecekan eskalasi staf manusia (`/manusia|orang asli|human|staf|agent|admin|bantuan langsung/i`). Jika cocok, lakukan handoff.
   - Pengecekan intent masukan/fitur (`isFeedbackIntent`):
     ```typescript
     const isFeedbackIntent = /fitur|tolong buatkan|bisa tambahkan|usul|ide|saran|request|masukan|bug|kendala|error|tambah|update|bisa gak|bisa nggak|fitur baru|feature/i.test(prompt)
     ```
2. **Pencarian Kemiripan Semantik**:
   - Jika `isFeedbackIntent === true`:
     - Ambil seluruh postingan aktif milik workspace (`status !== 'closed' && status !== 'merged'`).
     - Hasilkan vektor embedding prompt: `const promptVec = await generateEmbedding(prompt)`.
     - Hitung skor kemiripan kosinus terhadap setiap post (`cosineSimilarity(promptVec, post.embedding)`).
     - Urutkan kandidat berdasarkan skor tertinggi.
3. **Penentuan Tindakan (Action Decision)**:
   - **Kasus 1: Kandidat teratas memiliki `similarityScore >= 0.70`**:
     - Buat teks balasan Juno yang ramah:  
       `"Terima kasih atas masukannya! Kami menemukan ide serupa yang sudah tercatat di roadmap kami: '${topPost.title}'. Apakah Anda ingin menambahkan upvote untuk mendukung ide ini?"`
     - Lampirkan payload aksi:
       ```json
       {
         "type": "similar_post",
         "post": {
           "id": topPost.id,
           "title": topPost.title,
           "content": topPost.content,
           "votesCount": topPost.votesCount,
           "status": topPost.status,
           "boardSlug": topPost.boardSlug || "fitur"
         },
         "similarityScore": topScore
       }
       ```
   - **Kasus 2: `isFeedbackIntent === true` namun skor < 0.70 (Ide Baru)**:
     - Dapatkan board publik utama workspace (board dengan slug `fitur` atau board pertama).
     - Ekstrak draf judul singkat dari prompt (maksimal 60 karakter atau kalimat pertama).
     - Buat teks balasan Juno:  
       `"Ide atau masukan yang sangat bagus! Kami belum menemukan ide serupa di roadmap kami. Apakah Anda ingin mendaftarkan ide ini langsung ke feedback board?"`
     - Lampirkan payload aksi:
       ```json
       {
         "type": "create_feedback",
         "boardId": targetBoard.id,
         "boardSlug": targetBoard.slug,
         "draft": {
           "title": draftTitle,
           "content": prompt
         }
       }
       ```
   - **Kasus 3: Bukan intent feedback**:
     - Lanjutkan alur RAG knowledge base standar (tanpa menyertakan kartu aksi).

4. **Protokol SSE Stream Output**:
   - Kirim token teks per chunk: `data: {"text": "..."}`.
   - Kirim chunk aksi sebelum penutup: `data: {"action": {...}}`.
   - Kirim terminator: `data: [DONE]`.
   - Simpan riwayat pesan Juno ke `messagesStore` (menyertakan properti `action` jika ada).

---

## 5. Spesifikasi Frontend Widget (`packages/widget`)

### 5.1 Rendering Kartu Aksi (`MessagesTab.svelte`)

Jika `message.action` tersedia pada bubble obrolan:

1. **Untuk Aksi `similar_post`**:
   - Header badge: `"Ide Serupa Ditemukan (" + Math.round(score * 100) + "% Cocok)"`.
   - Judul post (tebal) & status badge (`In Progress`, `Planned`, dll) serta total votes.
   - Status Resolusi:
     - Jika `actionResolved === true`: tampilkan badge hijau `"✓ Upvote Anda telah ditambahkan"`.
     - Jika belum:
       - Jika pengguna **Guest** (`!user?.email`): tampilkan input teks email kecil dengan placeholder `"Email Anda untuk update status"`.
       - Tombol aksi: `[ +1 Upvote Ide Ini ]` (atau menampilkan nama email jika identified user).
2. **Untuk Aksi `create_feedback`**:
   - Header badge: `"✨ Usulkan Ide Baru"`.
   - Judul draf masukan & target board.
   - Status Resolusi:
     - Jika `actionResolved === true`: tampilkan badge hijau `"✓ Ide telah dikirim ke board"`.
     - Jika belum:
       - Jika pengguna **Guest**: tampilkan input email inline.
       - Tombol aksi: `[ Kirim ke Feedback Board ]`.

### 5.2 Alur Interaksi & Notifikasi Chat
- Saat tombol ditekan:
  - Tombol masuk ke state `isSubmitting = true` (spinner).
  - Validasi email jika guest (harus format email valid).
  - Eksekusi request API:
    - Upvote: `POST /api/v1/posts/:postId/vote` dengan body `{ userEmail, userId, userTraits }`.
    - Create: `POST /api/v1/boards/:boardId/posts` dengan body `{ title, content, authorEmail, authorName }`.
  - Setelah response sukses:
    - Set `message.actionResolved = true`.
    - Tambahkan pesan konfirmasi instan dari Juno ke dalam obrolan:
      - Untuk upvote: *"Terima kasih! Suara Anda telah berhasil ditambahkan ke '[Judul Post]'. Kami akan mengabari Anda jika ada pembaruan status pada fitur ini."*
      - Untuk create: *"Saran Anda telah berhasil dikirim ke board. Tim produk kami akan segera meninjaunya!"*
    - Scroll otomatis obrolan ke bawah (`scrollToBottom()`).

---

## 6. Rencana Pengujian (Test Plan)

1. **Shared Contract Tests (`packages/shared/tests/chat-schemas.test.ts`)**:
   - Validasi struktur `JunoActionPayload`, `JunoSimilarPostAction`, dan `JunoCreateFeedbackAction`.
2. **Backend API Tests (`apps/api/tests/chat-feedback-bridge.test.ts`)**:
   - Menguji deteksi intent feedback pada pesan chat.
   - Menguji pemilihan post serupa jika kemiripan >= 0.70 dan pembuatan payload `similar_post`.
   - Menguji usulan pembuatan post baru jika kemiripan < 0.70 dan pembuatan payload `create_feedback`.
   - Menguji kelengkapan urutan SSE chunk (teks, action, `[DONE]`).
   - Menguji persistensi pesan dan isolasi workspace.
3. **Widget Frontend Tests (`packages/widget/tests/chat-feedback-bridge.test.ts`)**:
   - Menguji parsing chunk SSE berformat action card.
   - Menguji rendering kartu `similar_post` dan `create_feedback`.
   - Menguji interaksi 1-click upvote untuk identified user.
   - Menguji inline email input validation untuk guest user.
   - Menguji transisi state `actionResolved` dan penambahan pesan balasan konfirmasi dari Juno.
4. **Verifikasi Monorepo Lengkap**:
   - Memastikan `turbo run check` dan `turbo run test` 100% lulus tanpa error dan warning.
