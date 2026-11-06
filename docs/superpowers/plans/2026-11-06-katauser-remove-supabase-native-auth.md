# Katauser Native Auth & Supabase Removal Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghapus seluruh dependensi Supabase (`@supabase/*`) dan menggantikannya dengan Native Authentication berbasis Hono API, Drizzle ORM schema (`users`, `sessions`, `accounts`), zero-dependency native password hashing (`node:crypto` scrypt), dan form login Svelte 5.

**Architecture:**
- `packages/shared/src/schemas/auth.ts`: Zod schemas untuk `registerSchema`, `loginSchema`, dan `userProfileSchema`.
- `apps/api/src/modules/auth/auth.route.ts`: Endpoint `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` dengan cookie HttpOnly session.
- `apps/api/src/services/password-hasher.ts`: `hashPassword` dan `verifyPassword` berbasis `node:crypto.scryptSync`.
- `apps/web/src/hooks.server.ts`: Ganti Supabase server client dengan session cookie handler native.
- `apps/web/src/routes/(marketing)/login/*`: Ganti `@supabase/auth-ui-svelte` dengan form login/register native Svelte 5 daisyUI.
- Hapus paket `@supabase/*` dari `apps/web/package.json`, hapus folder `supabase/`, dan bersihkan environment variables.

---

### Task 1: Auth Schemas & Native Password Hasher
**Files:**
- Create: `packages/shared/src/schemas/auth.ts`
- Modify: `packages/shared/src/index.ts`
- Create: `apps/api/src/services/password-hasher.ts`
- Create: `apps/api/tests/password-hasher.test.ts`

- [ ] Tulis unit test untuk `hashPassword` dan `verifyPassword` menggunakan `node:crypto`.
- [ ] Implementasikan `auth.ts` schema di `@katauser/shared`.
- [ ] Implementasikan `password-hasher.ts` di `apps/api/src/services/`.
- [ ] Jalankan vitest hingga passing 100%.

### Task 2: Hono API Native Auth Route
**Files:**
- Create: `apps/api/src/modules/auth/auth.route.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/tests/auth-native.test.ts`

- [ ] Tulis test untuk register user baru, login dengan password benar/salah, session cookie, dan `GET /auth/me`.
- [ ] Implementasikan `authRoute` di `apps/api/src/modules/auth/auth.route.ts`.
- [ ] Daftarkan `authRoute` di `apps/api/src/app.ts`.
- [ ] Jalankan vitest di `apps/api` hingga passing 100%.

### Task 3: SvelteKit Hooks & Native Session Guard
**Files:**
- Modify: `apps/web/src/hooks.server.ts`
- Modify: `apps/web/src/app.d.ts`
- Create: `apps/web/tests/native-auth-guard.test.ts`

- [ ] Tulis test untuk session validation logic dan auth redirect guard.
- [ ] Bersihkan Supabase client dari `hooks.server.ts`, ganti dengan cookie `katauser_session` resolver.
- [ ] Perbarui `app.d.ts` Locals interface (`user?: { id, email, name, role }`).

### Task 4: Svelte 5 Native Login & Register UI
**Files:**
- Modify: `apps/web/src/routes/(marketing)/login/sign_in/+page.svelte` & `+page.server.ts`
- Modify: `apps/web/src/routes/(marketing)/login/sign_up/+page.svelte` & `+page.server.ts`
- Modify: `apps/web/src/routes/(marketing)/login/+layout.svelte`
- Delete/Clean: `apps/web/src/routes/(marketing)/login/login_config.ts`

- [ ] Buat form login & register native Svelte 5 menggunakan daisyUI (`input input-bordered`, error alerts, loading state).
- [ ] Handle server actions `login` dan `register` yang memanggil Hono API dan men-set session cookie.
- [ ] Jalankan `svelte-check` dan vitest di `apps/web` hingga 100% passing.

### Task 5: Supabase Clean Up & Monorepo Hardening
**Files:**
- Modify: `apps/web/package.json` (uninstall `@supabase/*`)
- Delete: `supabase/` directory & `database_migration.sql`
- Modify: `.env.example`, `apps/api/.env`, `apps/web/.env`
- Modify: `@docs/deployment-coolify.md`

- [ ] Uninstall seluruh paket `@supabase/*` dari `apps/web`.
- [ ] Hapus artefak dan env var Supabase di repo.
- [ ] Jalankan `turbo check test build` di seluruh monorepo untuk memastikan tidak ada sisa broken imports.
- [ ] Merge ke `main` dan update memory.
