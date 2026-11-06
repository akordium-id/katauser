# Panduan Integrasi In-App Widget (`@katauser/widget`)

Widget Katauser adalah Custom Element mandiri (Web Component Shadow DOM) yang menyediakan tab Feedback, Roadmap, Changelog, dan Live Chat / AI Juno di dalam aplikasi web Anda.

---

## 1. Menyematkan Script Widget

Tambahkan script loader di bagian `<head>` atau tepat sebelum tag penutup `</body>` pada aplikasi web Anda:

```html
<script src="https://katauser.com/widget/katauser.js" async defer></script>
```

---

## 2. Inisialisasi Widget

Panggil `window.Katauser.init()` setelah script termuat:

```html
<script>
  window.addEventListener('DOMContentLoaded', () => {
    if (window.Katauser) {
      window.Katauser.init({
        workspaceSlug: 'acme',                  // Slug workspace Katauser Anda
        apiBaseUrl: 'https://api.katauser.com', // Opsional (default ke https://api.katauser.com)
        primaryColor: '#2563eb',               // Warna aksen tombol & badge
        position: 'bottom-right'               // 'bottom-right' | 'bottom-left'
      });
    }
  });
</script>
```

---

## 3. Identifikasi Pengguna & Verifikasi HMAC (User Identification)

Untuk mengaitkan data feedback, voting, dan percakapan chat dengan akun user di aplikasi Anda secara aman tanpa spoofing identitas, gunakan **HMAC SHA-256**:

### A. Generate Hash di Backend Anda

Gunakan secret key workspace dari dashboard Katauser (`Settings > Widget`):

```typescript
// Contoh di Node.js backend
import crypto from 'node:crypto';

function generateKatauserHmac(userId: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(userId).digest('hex');
}
```

### B. Kirim Identitas dari Frontend

```javascript
window.Katauser.identify({
  userId: 'usr_12345',
  email: 'budi@acme.com',
  name: 'Budi Santoso',
  avatarUrl: 'https://avatar.acme.com/budi.png',
  hmacSignature: 'a8f5c...generated_from_backend...'
});
```

---

## 4. Kontrol Programatik (SDK API)

Anda dapat mengontrol widget secara programatik (misalnya dari tombol bantuan di navbar aplikasi):

```javascript
// Buka widget modal
window.Katauser.open();

// Tutup widget modal
window.Katauser.close();

// Toggle buka/tutup
window.Katauser.toggle();

// Langsung arahkan ke tab tertentu
// Pilihan: 'feedback' | 'roadmap' | 'changelog' | 'messages'
window.Katauser.setTab('messages');
```

---

## 5. Shadow DOM & Keamanan Styling

Widget Katauser sepenuhnya dirender di dalam Shadow DOM:
- CSS host tidak akan merusak layout widget.
- Style widget tidak akan bocor ke aplikasi induk.
- Ukuran bundle sangat ringan (~27 kB gzipped) tanpa runtime eksternal.
