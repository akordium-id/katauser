# Katauser Integrations, Traits & Email Notification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur User Traits (MRR/Plan), Outbound Webhooks (Slack/Discord), dan Automated Email Notification Loop (Resend) agar produk Katauser memiliki kapabilitas setara UserJot.

**Architecture:**

- Semi-structured `traits` pada Widget Identify & Voter store dengan agregator total revenue MRR.
- Outbound Webhooks Dispatcher di Hono dengan adapter format native Slack Blocks dan Discord Embeds.
- Transactional email notifier dengan HTML template responsive dan fallback gracefully saat `RESEND_API_KEY` tidak terpasang.
- Integrasi ke SvelteKit admin dashboard untuk revenue-weighted badges dan settings panel integrasi.

**Tech Stack:** Hono, SvelteKit, TypeScript, Zod, Vitest.

**Spec:** ATM UserJot Gap Analysis (User Traits, Slack/Discord Webhooks, Resend Email Loop).

## Global Constraints

- Strict Decoupled API (Hono API single source of truth, SvelteKit pure UI/SSR consumer).
- Svelte 5 Runes (`$state`, `$props`, `$derived`, `$effect`) untuk semua komponen UI baru.
- Strict TDD (Tulis failing test dulu, implementasikan kode, sampai passing 100%).
- Non-blocking webhook & email dispatch agar latensi HTTP API tetap sub-100ms.

---

### Task 1: User Traits Schema & Revenue-Weighted Calculation

**Files:**

- Create/Modify: `packages/shared/src/schemas/widget.ts`
- Create/Modify: `packages/shared/src/schemas/traits.ts`
- Create: `packages/shared/tests/traits-schemas.test.ts`
- Export: `packages/shared/src/index.ts`

- [ ] Tulis unit test untuk validasi `traits` (`plan`, `mrr`, `company`, `custom`) dan fungsi pembantu `calculateRevenueImpact(voters)`.
- [ ] Implementasikan schema `userTraitsSchema` dan perbarui `widgetIdentifySchema`.
- [ ] Implementasikan helper `calculateRevenueImpact`.
- [ ] Jalankan vitest di `packages/shared` hingga passing 100%.

### Task 2: Outbound Webhook Formatter & Dispatcher (Slack & Discord)

**Files:**

- Create: `packages/shared/src/schemas/integrations.ts`
- Create: `apps/api/src/modules/integrations/webhook-dispatcher.ts`
- Create: `apps/api/tests/webhook-dispatcher.test.ts`

- [ ] Tulis unit test untuk formatting payload Slack Block Kit dan Discord Rich Embeds untuk event `post.created`, `post.voted`, dan `chat.escalated`.
- [ ] Implementasikan fungsi `formatSlackPayload` dan `formatDiscordPayload`.
- [ ] Implementasikan `dispatchWebhookEvent` dengan error handling graceful (timeout & status error tidak membuat throw).
- [ ] Jalankan vitest di `apps/api` hingga passing 100%.

### Task 3: Automated Voter Email Notification Service

**Files:**

- Create: `packages/shared/src/schemas/notifications.ts`
- Create: `apps/api/src/services/email-notifier.ts`
- Create: `apps/api/tests/email-notifier.test.ts`

- [ ] Tulis unit test untuk rendering template email status update dan changelog release notice.
- [ ] Implementasikan `renderVoterStatusUpdateEmail` dan `sendVoterNotificationEmail` (mocking / Resend API).
- [ ] Jalankan vitest di `apps/api` hingga passing 100%.

### Task 4: Wire-up Events di Hono API Routes (Posts & Chat)

**Files:**

- Modify: `apps/api/src/modules/feedback/posts.route.ts`
- Modify: `apps/api/src/modules/chat/chat.route.ts`
- Create: `apps/api/tests/integrations-events.test.ts`

- [ ] Tulis integration test memverifikasi pemicu webhook saat post dibuat, vote di-cast dengan traits, status post diubah (kirim email ke voters), dan chat dieskalasi.
- [ ] Modifikasi `posts.route.ts` untuk merekam `traits` voter, menghitung total MRR, serta mentrigger dispatcher webhook & email.
- [ ] Modifikasi `chat.route.ts` untuk mentrigger dispatcher webhook saat `escalate` dipanggil.
- [ ] Jalankan vitest di `apps/api` hingga passing 100%.

### Task 5: Admin UI Enhancements di SvelteKit Web

**Files:**

- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/integrations/+page.svelte`
- Create: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/integrations/+page.server.ts`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/+page.svelte`
- Create: `apps/web/tests/integrations-ui.test.ts`

- [ ] Tulis component/helper test untuk validasi URL webhook dan rendering revenue badge.
- [ ] Buat UI Settings Integrations (konfigurasi Slack Webhook & Discord Webhook) di SvelteKit.
- [ ] Perbarui tampilan list feedback posts di Admin Board untuk menampilkan badge Total MRR Impact.
- [ ] Jalankan vitest dan `svelte-check` di `apps/web` hingga passing 100%.
