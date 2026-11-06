# Katauser Phase 4: In-App Embed Widget Package Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun package `@katauser/widget` berbasis Svelte 5 Web Component (`<katauser-widget>`) di dalam Shadow DOM yang di-bundle menjadi single JS file (`dist/katauser.js`), siap di-embed via script tag atau SDK `window.Katauser`, lengkap dengan endpoint HMAC user identification di `apps/api`.

**Architecture:**
- `@katauser/shared`: Zod schema `widgetIdentifySchema` & HMAC helper.
- `apps/api`: Route `POST /api/v1/widget/identify` untuk validasi identitas pengguna via HMAC SHA-256.
- `packages/widget`:
  - Svelte 5 Custom Element `<katauser-widget>` dalam Shadow DOM (CSS terisolasi total dari website host).
  - Multi-tab widget modal: Feedback, Roadmap, Changelog, & Messages.
  - SDK global: `window.Katauser` (`init`, `identify`, `open`, `close`, `toggle`).
  - Vite library mode single-bundle build output (`dist/katauser.js`).

**Tech Stack:** Svelte 5 (Runes & Custom Elements), Vite, TypeScript, Hono v4, Vitest.

---

## Global Constraints

- Bundle hasil build harus single-file self-contained JavaScript (`dist/katauser.js`) tanpa external runtime dependency.
- CSS wajib terenkapsulasi penuh dalam Shadow DOM (tidak mengotori atau terpengaruh stylesheet halaman host).
- Svelte 5 reactive runes (`$state`, `$derived`, `$props`, `$effect`).
- HMAC SHA-256 verification untuk identitas user (mencegah impersonation di live widget).

---

## Implementation Tasks

### Task 1: Zod Schema & HMAC Verification Helper di `@katauser/shared`
**Files:**
- Create: `packages/shared/src/schemas/widget.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/widget-schemas.test.ts`

**Steps:**
- [ ] 1. Tulis failing test di `packages/shared/tests/widget-schemas.test.ts` untuk `widgetIdentifySchema` dan fungsi helper HMAC verification.
- [ ] 2. Implementasikan schema Zod dan helper HMAC SHA-256 verification.
- [ ] 3. Ekspor dari `packages/shared/src/index.ts`.
- [ ] 4. Jalankan test `pnpm --filter @katauser/shared test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(shared): add widget identify schema and hmac verification helper`.

---

### Task 2: Hono Widget Identify RPC Endpoint di `apps/api`
**Files:**
- Create: `apps/api/src/modules/widget/widget.route.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/widget-identify.test.ts`

**Steps:**
- [ ] 1. Tulis failing test di `apps/api/tests/widget-identify.test.ts` untuk endpoint `POST /api/v1/widget/identify` (menguji valid HMAC, invalid HMAC, dan guest identity).
- [ ] 2. Implementasikan route modular `widgetRoute` di `apps/api/src/modules/widget/widget.route.ts`.
- [ ] 3. Hubungkan ke `apps/api/src/app.ts` tanpa merusak `export type AppType`.
- [ ] 4. Jalankan test `pnpm --filter @katauser/api test` hingga pass (GREEN).
- [ ] 5. Commit: `feat(api): implement widget identify rpc endpoint with hmac verification`.

---

### Task 3: Setup Package `@katauser/widget` & Vite Single-Bundle Config
**Files:**
- Create: `packages/widget/package.json`
- Create: `packages/widget/tsconfig.json`
- Create: `packages/widget/vite.config.ts`
- Test: `packages/widget/tests/sdk.test.ts`

**Steps:**
- [ ] 1. Buat konfigurasi `package.json`, `tsconfig.json`, dan `vite.config.ts` untuk `@katauser/widget` dengan Svelte 5 compiler options `customElement: true` dan output IIFE bundle `dist/katauser.js`.
- [ ] 2. Tulis failing test untuk SDK state manager di `packages/widget/tests/sdk.test.ts`.
- [ ] 3. Jalankan `pnpm install` jika diperlukan.
- [ ] 4. Commit: `feat(widget): scaffold package and single-bundle vite configuration`.

---

### Task 4: Svelte 5 Custom Element `<katauser-widget>` dalam Shadow DOM
**Files:**
- Create: `packages/widget/src/KatauserWidget.svelte`
- Create: `packages/widget/src/components/TriggerButton.svelte`
- Create: `packages/widget/src/components/WidgetPanel.svelte`
- Create: `packages/widget/src/components/tabs/FeedbackTab.svelte`
- Create: `packages/widget/src/components/tabs/RoadmapTab.svelte`
- Create: `packages/widget/src/components/tabs/ChangelogTab.svelte`
- Create: `packages/widget/src/components/tabs/MessagesTab.svelte`

**Steps:**
- [ ] 1. Buat komponen Svelte 5 `<katauser-widget>` dengan `<svelte:options customElement="katauser-widget" />`.
- [ ] 2. Implementasikan floating trigger button (posisi bawah kanan, animasi hover, unread badge).
- [ ] 3. Implementasikan popup modal dengan 4 tab interaktif (Feedback, Roadmap, Changelog, Messages placeholder).
- [ ] 4. Uji render dan interaksi buka/tutup modal.
- [ ] 5. Commit: `feat(widget): implement svelte 5 custom element and tabbed panel in shadow dom`.

---

### Task 5: Global SDK `window.Katauser` & Auto-Init Script Tag
**Files:**
- Create: `packages/widget/src/index.ts`
- Create: `packages/widget/src/sdk.ts`
- Test: `packages/widget/tests/sdk.test.ts`

**Steps:**
- [ ] 1. Implementasikan `Katauser` global SDK object (`init`, `identify`, `open`, `close`, `toggle`).
- [ ] 2. Tambahkan auto-initialization saat script dimuat dengan atribut `data-workspace`.
- [ ] 3. Jalankan pengujian SDK dan verifikasi build `pnpm --filter @katauser/widget build`.
- [ ] 4. Jalankan full type check dan test suite di seluruh monorepo (`turbo run check test`).
- [ ] 5. Jalankan full production build (`turbo run build`).
- [ ] 6. Commit: `feat(widget): add global window.Katauser sdk and auto-initialization`.

