# Integrasi Outbound Webhook & Notifikasi Email

Panduan konfigurasi webhook eksternal (Slack & Discord) serta pengiriman email otomatis ke para pemilih (*voters*).

---

## 1. Outbound Webhook (Slack & Discord)

Katauser mendukung pengiriman notifikasi otomatis langsung ke channel kerja tim Anda ketika terjadi aktivitas penting di workspace.

### Tipe Event yang Didukung
| Event | Kapan Dijalankan | Deskripsi Notifikasi |
|---|---|---|
| `post.created` | Customer membuat ide / feedback baru | Judul ide, deskripsi ringkas, pembuat, dan link ke board |
| `post.voted` | Pengguna memberikan upvote | Judul ide, total votes saat ini, dan akumulasi nilai MRR jika ada |
| `chat.escalated` | Pengguna meminta agen manusia di chat | ID tiket percakapan, pesan pelanggan, dan tombol langsung ke Admin Inbox |

---

## 2. Cara Konfigurasi Webhook di Dashboard

1. Masuk ke **Dashboard Admin** > **Settings** > **Integrasi Webhook** (`/dashboard/[workspaceSlug]/settings/integrations`).
2. Masukkan URL Webhook:
   - **Slack**: Buat di Slack App Directory > *Incoming WebHooks* (contoh: `https://hooks.slack.com/services/...`).
   - **Discord**: Buat di Discord Channel Settings > *Integrations* > *Webhooks* (contoh: `https://discord.com/api/webhooks/...`).
3. Klik tombol **Kirim Tes Notifikasi** untuk memastikan bot berhasil memposting pesan ke channel.
4. Klik **Simpan Pengaturan**.

---

## 3. Notifikasi Email Otomatis ke Voters (Resend)

Ketika tim Anda mengubah status ide masukan atau merilis changelog:
- **Status Notifikasi**: `planned` (Direncanakan), `in_progress` (Sedang Dikerjakan), dan `shipped` (Telah Dirilis).
- Sistem mengambil seluruh alamat email pengguna yang pernah memberikan vote pada ide tersebut.
- Mengirimkan email transaksional dengan tautan langsung ke rilis baru di changelog.

### Konfigurasi Environment API
Tambahkan API key Resend pada file environment API (`apps/api/.env`):
```env
RESEND_API_KEY=re_your_api_key_here
```
*Catatan: Jika `RESEND_API_KEY` tidak diatur, sistem otomatis berjalan dalam mode `mock` dan mencatat log pengiriman secara aman tanpa error.*
