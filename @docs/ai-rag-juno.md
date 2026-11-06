# Basis Pengetahuan & AI Agent Juno (RAG)

Dokumentasi arsitektur kecerdasan buatan, sistem RAG (_Retrieval-Augmented Generation_), dan deteksi duplikasi ide semantik pada Katauser.

---

## 1. Ikhtisar AI Juno

Juno adalah agen dukungan pelanggan dan asisten produk bawaan di Katauser:

- **Tersedia di In-App Widget**: Pengunjung atau pengguna terotentikasi dapat bertanya langsung mengenai cara penggunaan produk, kebijakan penagihan, atau status fitur.
- **RAG-Augmented SSE Streaming**: Juno tidak hanya merespon dengan template statis, melainkan mencari informasi dari artikel dokumentasi yang telah diunggah ke _Knowledge Base_, lalu melakukan streaming jawaban via Server-Sent Events (`POST /api/v1/chat/conversations/:id/juno-stream`).
- **Human Escalation**: Jika pertanyaan pengguna membutuhkan bantuan manusia (misal komplain bug kritis atau billing rumit), Juno secara otomatis mengalihkan tiket percakapan ke staf support dan mengirimkan notifikasi instan ke Slack/Discord.

---

## 2. Ingestion & Text Chunking

Admin workspace dapat memasukkan artikel dokumentasi atau FAQ via Dashboard Admin (`Settings > AI Knowledge Base`) atau melalui API:

```http
POST /api/v1/workspaces/:slug/knowledge/ingest
Content-Type: application/json

{
  "title": "Kebijakan Pengembalian Dana (Refund)",
  "content": "Pengembalian dana (refund) dapat diajukan dalam kurun waktu 14 hari kerja setelah pembelian. Tim finance akan memproses dana dalam 3-5 hari kerja.",
  "sourceUrl": "https://docs.yourcompany.com/refund",
  "sourceType": "doc"
}
```

### Mekanisme Chunking

- Dokumen panjang secara otomatis dipecah menjadi bagian-bagian berukuran ~400 karakter dengan overlap 40 karakter.
- Pemecahan memprioritaskan batas paragraf (`\n`) dan kalimat (`. `) agar makna kontekstual tetap terjaga.

---

## 3. Vektorisasi & Cosine Similarity

Katauser menggunakan representasi vektor 1536-dimensi:

- **Produksi**: Jika `OPENAI_API_KEY` diatur di environment, sistem menggunakan model OpenAI `text-embedding-3-small`.
- **Pengembangan / Pengujian Lokal**: Jika tidak ada API key, sistem menggunakan _deterministic normalized pseudo-vector generator_ sehingga seluruh pengujian berjalan cepat, 100% offline, tanpa biaya token.
- **Kalkulasi Kemiripan**: Kemiripan semantik dihitung menggunakan Cosine Similarity:
  $$\text{Cosine Similarity}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$

---

## 4. Semantic Duplicate Detection (Deteksi Duplikasi Ide)

Saat pengguna ingin membuat saran masukan baru, frontend atau widget dapat memanggil endpoint `/similar` untuk mengecek apakah ide tersebut sudah pernah diusulkan sebelumnya:

```http
POST /api/v1/boards/:boardId/posts/similar
Content-Type: application/json

{
  "title": "Opsi Tema Gelap untuk Dashboard",
  "content": "Mohon sediakan dark mode agar mata tidak cepat lelah saat malam hari.",
  "threshold": 0.5,
  "limit": 3
}
```

### Respon API:

```json
{
  "success": true,
  "similarPosts": [
    {
      "id": "post_darkmode_1",
      "title": "Dark Mode Support",
      "content": "Add dark theme toggle in top right navbar",
      "votesCount": 24,
      "totalMrr": 1250,
      "similarityScore": 0.82
    }
  ]
}
```

Jika ide serupa ditemukan dengan skor kemiripan tinggi, sistem dapat menyarankan pengguna untuk memberikan upvote pada ide yang sudah ada alih-alih membuat post duplikat di backlog.
