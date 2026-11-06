# Panduan Deployment di Coolify (VPS)

Panduan deploy monorepo Katauser ke Coolify via Docker Compose atau Multi-Service Dockerfiles di VPS.

---

## 1. Arsitektur Deployment di Coolify

```mermaid
graph TD
    Internet([Traefik Reverse Proxy Coolify]) -->|katauser.com / *.katauser.com| WebApp["SvelteKit Web SSR (:5173)"]
    Internet -->|custom-domain.customer.com| WebApp
    Internet -->|api.katauser.com| ApiService["Hono API (:3000)"]
    
    WebApp -->|Internal RPC / HTTP| ApiService
    ApiService --> Postgres[(PostgreSQL 16 + pgvector)]
    ApiService --> Redis[(Redis 7)]
```

---

## 2. Pilihan Cara Deploy di Coolify

### Opsi A: Deploy via Docker Compose (Direkomendasikan)
1. Di Coolify dashboard, pilih **New Resource** > **Docker Compose**.
2. Masukkan file [`docker/docker-compose.prod.yml`](file:///home/orin/code/archive/katauser-app/docker/docker-compose.prod.yml).
3. Set environment variables di dashboard Coolify.

### Opsi B: Deploy via Separate Services (Nixpacks / Dockerfile)
- **Service API**: Base Directory `/`, Dockerfile path `docker/Dockerfile.api`, Port `3000`.
- **Service Web**: Base Directory `/`, Dockerfile path `docker/Dockerfile.web`, Port `5173`.
- **Database**: Add Managed PostgreSQL (aktifkan extension pgvector via SQL: `CREATE EXTENSION IF NOT EXISTS vector;`).
- **Redis**: Add Managed Redis.

---

## 3. Environment Variables Wajib

### Service: `katauser-api` (`apps/api`)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://katauser:supersecret@katauser-db:5432/katauser_prod
REDIS_URL=redis://katauser-redis:6379
JWT_SECRET=your_super_strong_jwt_secret_min_32_chars
OPENAI_API_KEY=sk-proj-... # Untuk AI Agent Juno SSE Stream
CORS_ORIGINS=https://katauser.com,https://app.katauser.com
CNAME_TARGET=cname.katauser.com
```

### Service: `katauser-web` (`apps/web`)
```env
NODE_ENV=production
PORT=5173
PUBLIC_API_URL=https://api.katauser.com
INTERNAL_API_URL=http://katauser-api:3000
PUBLIC_MAIN_DOMAIN=katauser.com
BODY_SIZE_LIMIT=10485760
```

---

## 4. Konfigurasi Trusted Proxy & Custom Domain di Belakang Traefik

Karena Coolify menggunakan Traefik sebagai ingress proxy:
1. Pastikan header `X-Forwarded-For` dan `X-Forwarded-Proto` diteruskan secara default oleh Traefik.
2. Di Coolify service `katauser-web`, tambahkan Domain: `https://katauser.com, https://*.katauser.com`.
3. Untuk mendukung **Custom Domains tenant** (misalnya `feedback.acme.com`):
   - Di Coolify domain field, tambahkan domain custom yang didaftarkan tenant atau gunakan Traefik route catch-all rule jika ingin sepenuhnya otomatis.
   - Tenant cukup mengarahkan DNS record:
     - Tipe **CNAME** untuk subdomain (`feedback` -> `cname.katauser.com`).
     - Tipe **A Record** untuk apex (`@` -> IP VPS Coolify Anda).

---

## 5. Menjalankan Database Migration

Jalankan perintah ini di container API atau saat proses pre-deploy:

```bash
pnpm --filter @katauser/db push
# atau jika menggunakan file migrasi:
pnpm --filter @katauser/db migrate
```

---

## 6. Verifikasi Healthcheck

- **API Health**: `curl -f https://api.katauser.com/health` (harus mengembalikan `200 OK {"status":"ok"}`).
- **Web App**: Akses `https://katauser.com` via browser untuk memastikan SSR bundle berjalan lancar.

