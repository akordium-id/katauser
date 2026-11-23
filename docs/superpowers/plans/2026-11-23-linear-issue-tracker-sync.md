# Linear Issue Tracker Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghubungkan Katauser dengan Linear Issue Tracker via Personal API Key & Inbound Webhook sehingga admin dapat membuat/menautkan issue dari feedback post, dan saat issue selesai di Linear, status post Katauser otomatis `completed` serta memberitahu seluruh voters via email.

**Architecture:** Menggunakan arsitektur modular `IssueTrackerProvider` di `@katauser/shared`, skema relasional Drizzle `workspace_integrations` dan `post_issues` di `@katauser/db`, native GraphQL client di `@katauser/api`, verifikasi tanda tangan HMAC SHA-256 pada webhook endpoint multi-tenant, serta antarmuka manajemen di SvelteKit `@katauser/web`.

**Tech Stack:** TypeScript, Drizzle ORM (PostgreSQL), Hono RPC API, Linear GraphQL API (native fetch), Node `crypto` (`createHmac`, `timingSafeEqual`), Svelte 5 + SvelteKit, daisyUI, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-linear-issue-tracker-sync-design.md`

## Global Constraints

- Monorepo pnpm workspaces + Turborepo (`apps/api`, `apps/web`, `packages/db`, `packages/shared`).
- Self-host zero-config: menggunakan Personal API Key / PAT Linear dan Webhook Signing Secret tanpa mewajibkan OAuth App.
- Zero-dependency Linear client: native `fetch` ke `https://api.linear.app/graphql` tanpa `@linear/sdk` eksternal.
- Timing-safe webhook verification: header `Linear-Signature` diverifikasi dengan HMAC SHA-256 via `crypto.timingSafeEqual`.
- Idempotent voter notification: status `completed` hanya memicu Resend voter notification jika post belum berstatus `completed`.
- Strict typing & linting: lulus `pnpm check` (svelte-check) dan `pnpm test` (Vitest) 100%.

## Review Focus

- Webhook signature tampering: request webhook dengan signature palsu harus ditolak dengan HTTP 401 dan tidak mengubah database.
- Webhook idempotency & retry: pengiriman webhook berulang untuk issue yang sudah `completed` tidak boleh mengirim email duplikat ke voters.
- Invalid or revoked Linear API Key: penanganan graceful saat GraphQL mereturn status error atau authentication failure.
- Issue unlink & cascade: penghapusan post Katauser menghapus entri `post_issues` secara cascade tanpa menghapus issue asli di Linear.
- Linear identifier validation: format identifier issue seperti `ENG-142` divalidasi dengan regex dan lookup GraphQL sebelum ditautkan.

---

### Task 1: Drizzle Schemas & Repositories (`@katauser/db`)

**Files:**
- Create: `packages/db/src/schema/integrations.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/repositories/integrations.ts`
- Test: `packages/db/tests/integrations-repo.test.ts`

**Interfaces:**
- Consumes: `workspaces` dari `packages/db/src/schema/workspaces.ts`, `posts` dari `packages/db/src/schema/feedback.ts`
- Produces: `workspaceIntegrations`, `postIssues`, `IntegrationRepository` (`upsertWorkspaceIntegration`, `getWorkspaceIntegration`, `createPostIssue`, `getPostIssues`, `getPostIssueByExternalId`, `updatePostIssueStatus`, `deletePostIssue`)

- [ ] **Step 1: Write the failing test for integrations repository**

```typescript
// packages/db/tests/integrations-repo.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import { IntegrationRepository } from "../src/repositories/integrations"

describe("IntegrationRepository", () => {
  it("should upsert workspace integration credentials and retrieve them", async () => {
    const repo = new IntegrationRepository()
    const integration = await repo.upsertWorkspaceIntegration({
      workspaceId: "ws_demo",
      provider: "linear",
      apiKey: "lin_api_test_123",
      webhookSecret: "whsec_test_456",
      config: { organizationName: "Acme Corp", defaultTeamId: "team_eng" },
    })

    expect(integration.provider).toBe("linear")
    expect(integration.apiKey).toBe("lin_api_test_123")

    const fetched = await repo.getWorkspaceIntegration("ws_demo", "linear")
    expect(fetched?.config).toEqual({ organizationName: "Acme Corp", defaultTeamId: "team_eng" })
  })

  it("should create, list, and delete post issue links", async () => {
    const repo = new IntegrationRepository()
    const link = await repo.createPostIssue({
      workspaceId: "ws_demo",
      postId: "post_1",
      provider: "linear",
      externalIssueId: "lin_issue_uuid_1",
      issueIdentifier: "ENG-142",
      issueUrl: "https://linear.app/acme/issue/ENG-142",
      issueTitle: "CSV Export Support",
      issueStatus: "In Progress",
    })

    expect(link.issueIdentifier).toBe("ENG-142")

    const links = await repo.getPostIssues("post_1")
    expect(links).toHaveLength(1)
    expect(links[0].externalIssueId).toBe("lin_issue_uuid_1")

    await repo.updatePostIssueStatus(link.id, "Done")
    const updated = await repo.getPostIssueByExternalId("linear", "lin_issue_uuid_1")
    expect(updated?.issueStatus).toBe("Done")

    await repo.deletePostIssue(link.id)
    const afterDelete = await repo.getPostIssues("post_1")
    expect(afterDelete).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/db test tests/integrations-repo.test.ts`  
Expected: FAIL with "Cannot find module '../src/repositories/integrations'"

- [ ] **Step 3: Implement `workspaceIntegrations` and `postIssues` schemas and repository**

Buat skema Drizzle di `packages/db/src/schema/integrations.ts` sesuai spec, re-export di `packages/db/src/schema/index.ts`, dan implementasikan kelas `IntegrationRepository` dengan operasi Drizzle.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/db test tests/integrations-repo.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/schema/integrations.ts packages/db/src/schema/index.ts packages/db/src/repositories/integrations.ts packages/db/tests/integrations-repo.test.ts
git commit -m "feat(db): add workspaceIntegrations and postIssues schema with repository"
```

---

### Task 2: Zod Validation Schemas, Contract Types, & Provider Interfaces (`@katauser/shared`)

**Files:**
- Create: `packages/shared/src/schemas/integrations.ts`
- Create: `packages/shared/src/types/integrations.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/tests/linear-schemas.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `IssueTrackerProvider`, `LinearTeam`, `LinearIssueResult`, `saveLinearIntegrationSchema`, `createLinearIssueSchema`, `linkLinearIssueSchema`

- [ ] **Step 1: Write the failing test for Linear schemas**

```typescript
// packages/shared/tests/linear-schemas.test.ts
import { describe, it, expect } from "vitest"
import {
  saveLinearIntegrationSchema,
  createLinearIssueSchema,
  linkLinearIssueSchema,
} from "../src/schemas/integrations"

describe("Linear Schemas", () => {
  it("should validate saveLinearIntegrationSchema", () => {
    const valid = saveLinearIntegrationSchema.safeParse({
      apiKey: "lin_api_valid_token",
      webhookSecret: "whsec_valid_secret",
      defaultTeamId: "team_1",
    })
    expect(valid.success).toBe(true)

    const invalid = saveLinearIntegrationSchema.safeParse({ apiKey: "" })
    expect(invalid.success).toBe(false)
  })

  it("should validate createLinearIssueSchema", () => {
    const valid = createLinearIssueSchema.safeParse({
      postId: "p_1",
      teamId: "t_1",
      title: "Add dark mode to widget",
      priority: 2,
    })
    expect(valid.success).toBe(true)
  })

  it("should validate linkLinearIssueSchema", () => {
    const valid = linkLinearIssueSchema.safeParse({
      postId: "p_1",
      issueIdOrKey: "ENG-142",
    })
    expect(valid.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/shared test tests/linear-schemas.test.ts`  
Expected: FAIL with "Cannot find module '../src/schemas/integrations'"

- [ ] **Step 3: Implement Zod schemas and TypeScript interfaces**

Definisikan `saveLinearIntegrationSchema`, `createLinearIssueSchema`, `linkLinearIssueSchema` di `packages/shared/src/schemas/integrations.ts` dan tipe `IssueTrackerProvider`, `LinearTeam`, `LinearIssueResult` di `packages/shared/src/types/integrations.ts`. Export keduanya melalui `packages/shared/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/shared test tests/linear-schemas.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/schemas/integrations.ts packages/shared/src/types/integrations.ts packages/shared/src/index.ts packages/shared/tests/linear-schemas.test.ts
git commit -m "feat(shared): add linear integration zod schemas and provider contracts"
```

---

### Task 3: Linear GraphQL Provider Implementation & Tests (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/integrations/providers/linear.provider.ts`
- Test: `apps/api/tests/linear-provider.test.ts`

**Interfaces:**
- Consumes: `IssueTrackerProvider`, `LinearTeam`, `LinearIssueResult` dari `@katauser/shared`
- Produces: `LinearProvider` class dengan `testConnection`, `listTeams`, `createIssue`, `getIssue`

- [ ] **Step 1: Write the failing test for LinearProvider**

```typescript
// apps/api/tests/linear-provider.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { LinearProvider } from "../src/modules/integrations/providers/linear.provider"

describe("LinearProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("should successfully test connection and return organization name", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          viewer: {
            id: "user_1",
            name: "John Doe",
            organization: { name: "Acme Software" },
          },
        },
      }),
    })

    const provider = new LinearProvider()
    const result = await provider.testConnection("lin_api_valid")

    expect(result.success).toBe(true)
    expect(result.organizationName).toBe("Acme Software")
  })

  it("should list teams for workspace", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          teams: {
            nodes: [
              { id: "team_eng", name: "Engineering", key: "ENG" },
              { id: "team_prod", name: "Product", key: "PROD" },
            ],
          },
        },
      }),
    })

    const provider = new LinearProvider()
    const teams = await provider.listTeams("lin_api_valid")

    expect(teams).toHaveLength(2)
    expect(teams[0].key).toBe("ENG")
  })

  it("should create issue with backlink footer", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          issueCreate: {
            success: true,
            issue: {
              id: "lin_uuid_99",
              identifier: "ENG-99",
              title: "Export to CSV",
              url: "https://linear.app/acme/issue/ENG-99",
              state: { name: "Todo", type: "unstarted" },
            },
          },
        },
      }),
    })

    const provider = new LinearProvider()
    const issue = await provider.createIssue("lin_api_valid", {
      teamId: "team_eng",
      title: "Export to CSV",
      description: "Allow users to download CSV",
      postUrl: "https://katauser.com/dashboard/acme/posts/p_1",
    })

    expect(issue.identifier).toBe("ENG-99")
    expect(issue.status).toBe("Todo")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/api test tests/linear-provider.test.ts`  
Expected: FAIL with "Cannot find module '../src/modules/integrations/providers/linear.provider'"

- [ ] **Step 3: Implement `LinearProvider` using native GraphQL fetch**

Implementasikan `LinearProvider` di `apps/api/src/modules/integrations/providers/linear.provider.ts` dengan method `testConnection`, `listTeams`, `createIssue`, dan `getIssue`. Tambahkan footer markdown backlink otomatis ke deskripsi issue.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/api test tests/linear-provider.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/integrations/providers/linear.provider.ts apps/api/tests/linear-provider.test.ts
git commit -m "feat(api): implement LinearProvider with native GraphQL client and unit tests"
```

---

### Task 4: Inbound Webhook Signature Verification & Handler (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/integrations/linear-webhook.ts`
- Test: `apps/api/tests/linear-webhook.test.ts`

**Interfaces:**
- Consumes: `IntegrationRepository` (`@katauser/db`), `crypto` native
- Produces: `verifyLinearWebhookSignature`, `handleLinearWebhook`

- [ ] **Step 1: Write the failing test for Linear Webhook Handler**

```typescript
// apps/api/tests/linear-webhook.test.ts
import { describe, it, expect, vi } from "vitest"
import { createHmac } from "node:crypto"
import {
  verifyLinearWebhookSignature,
  handleLinearWebhook,
} from "../src/modules/integrations/linear-webhook"

describe("Linear Webhook Verification & Handler", () => {
  const secret = "whsec_test_secret_123"
  const rawBody = JSON.stringify({
    action: "update",
    type: "Issue",
    data: {
      id: "lin_issue_123",
      identifier: "ENG-142",
      title: "CSV Export",
      state: { name: "Done", type: "completed" },
    },
  })

  it("should return true for valid HMAC signature and false for tampered signature", () => {
    const validSignature = createHmac("sha256", secret).update(rawBody).digest("hex")
    expect(verifyLinearWebhookSignature(rawBody, validSignature, secret)).toBe(true)
    expect(verifyLinearWebhookSignature(rawBody, "invalid_signature", secret)).toBe(false)
  })

  it("should update post status to completed and trigger voter notifier on completed state", async () => {
    const mockRepo = {
      getPostIssueByExternalId: vi.fn().mockResolvedValue({
        id: "piss_1",
        postId: "post_42",
        workspaceId: "ws_acme",
        issueStatus: "In Progress",
      }),
      updatePostIssueStatus: vi.fn().mockResolvedValue(true),
    }

    const mockFeedbackRepo = {
      getPostById: vi.fn().mockResolvedValue({
        id: "post_42",
        title: "CSV Export",
        status: "in_progress",
      }),
      updatePostStatus: vi.fn().mockResolvedValue(true),
    }

    const mockVoterNotifier = vi.fn().mockResolvedValue(true)

    const result = await handleLinearWebhook({
      rawBody,
      signature: createHmac("sha256", secret).update(rawBody).digest("hex"),
      secret,
      repo: mockRepo as any,
      feedbackRepo: mockFeedbackRepo as any,
      notifyVoters: mockVoterNotifier,
    })

    expect(result.success).toBe(true)
    expect(mockFeedbackRepo.updatePostStatus).toHaveBeenCalledWith("post_42", "completed")
    expect(mockVoterNotifier).toHaveBeenCalledWith("post_42")
  })

  it("should be idempotent: do not notify voters if post is already completed", async () => {
    const mockRepo = {
      getPostIssueByExternalId: vi.fn().mockResolvedValue({
        id: "piss_1",
        postId: "post_42",
        issueStatus: "Done",
      }),
      updatePostIssueStatus: vi.fn(),
    }
    const mockFeedbackRepo = {
      getPostById: vi.fn().mockResolvedValue({
        id: "post_42",
        status: "completed", // Already completed!
      }),
      updatePostStatus: vi.fn(),
    }
    const mockVoterNotifier = vi.fn()

    await handleLinearWebhook({
      rawBody,
      signature: createHmac("sha256", secret).update(rawBody).digest("hex"),
      secret,
      repo: mockRepo as any,
      feedbackRepo: mockFeedbackRepo as any,
      notifyVoters: mockVoterNotifier,
    })

    expect(mockVoterNotifier).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/api test tests/linear-webhook.test.ts`  
Expected: FAIL with "Cannot find module '../src/modules/integrations/linear-webhook'"

- [ ] **Step 3: Implement `verifyLinearWebhookSignature` and `handleLinearWebhook`**

Implementasikan verifikasi HMAC SHA-256 dengan `timingSafeEqual` dan logika pemrosesan event `Issue:update` di `apps/api/src/modules/integrations/linear-webhook.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/api test tests/linear-webhook.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/integrations/linear-webhook.ts apps/api/tests/linear-webhook.test.ts
git commit -m "feat(api): implement linear webhook signature verification and status sync handler"
```

---

### Task 5: Hono API Routes (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/integrations/linear.route.ts`
- Modify: `apps/api/src/index.ts`
- Test: `apps/api/tests/linear-routes.test.ts`

**Interfaces:**
- Consumes: `LinearProvider`, `handleLinearWebhook`, `IntegrationRepository`, Zod schemas
- Produces: `linearRoute` mounted at `/api/v1/workspaces/:slug/integrations/linear` and `/api/v1/integrations/linear/webhook/:workspaceSlug`

- [ ] **Step 1: Write the failing test for Linear API routes**

```typescript
// apps/api/tests/linear-routes.test.ts
import { describe, it, expect, vi } from "vitest"
import { Hono } from "hono"
import { linearRoute } from "../src/modules/integrations/linear.route"

describe("Linear Hono Routes", () => {
  it("POST /workspaces/:slug/integrations/linear/test validates payload and tests connection", async () => {
    const app = new Hono().route("/", linearRoute)
    const res = await app.request("/workspaces/acme/integrations/linear/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: "lin_api_test" }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBeDefined()
  })

  it("POST /integrations/linear/webhook/:workspaceSlug handles inbound webhook", async () => {
    const app = new Hono().route("/", linearRoute)
    const res = await app.request("/integrations/linear/webhook/acme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Linear-Signature": "invalid",
      },
      body: JSON.stringify({ action: "update" }),
    })

    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/api test tests/linear-routes.test.ts`  
Expected: FAIL with "Cannot find module '../src/modules/integrations/linear.route'"

- [ ] **Step 3: Implement `linearRoute` in Hono and mount in main API**

Buat endpoint Hono di `apps/api/src/modules/integrations/linear.route.ts` dan daftarkan ke router utama di `apps/api/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/api test tests/linear-routes.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/integrations/linear.route.ts apps/api/src/index.ts apps/api/tests/linear-routes.test.ts
git commit -m "feat(api): mount linear integration and webhook routes in Hono"
```

---

### Task 6: Frontend Settings UI & Linear Issue Management (`apps/web`)

**Files:**
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/integrations/+page.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/settings/integrations/+page.server.ts`
- Create: `apps/web/src/lib/components/dashboard/LinearIssueModal.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/[boardSlug]/+page.svelte`
- Test: `apps/web/tests/linear-settings.test.ts`

**Interfaces:**
- Consumes: `/api/v1/workspaces/:slug/integrations/linear` endpoints
- Produces: Kartu pengaturan Linear di halaman Settings dan badge/modal pembuatan Linear Issue di board/post view.

- [ ] **Step 1: Write the failing test for Linear UI settings**

```typescript
// apps/web/tests/linear-settings.test.ts
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/svelte"
import LinearSettingsCard from "../src/lib/components/dashboard/LinearSettingsCard.svelte"

describe("LinearSettingsCard", () => {
  it("renders disconnected state with API key input and webhook copy button", () => {
    const { getByText, getByPlaceholderText } = render(LinearSettingsCard, {
      workspaceSlug: "acme",
      integration: null,
    })

    expect(getByText("Linear Issue Tracker")).toBeTruthy()
    expect(getByPlaceholderText("lin_api_...")).toBeTruthy()
    expect(getByText("Salin URL")).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @katauser/web test tests/linear-settings.test.ts`  
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement Svelte 5 components and update Settings page**

Implementasikan komponen `LinearSettingsCard.svelte`, `LinearIssueModal.svelte`, dan integrasikan ke halaman pengaturan dan manajemen post.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @katauser/web test tests/linear-settings.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/components/dashboard/LinearSettingsCard.svelte apps/web/src/lib/components/dashboard/LinearIssueModal.svelte apps/web/src/routes/(admin)/dashboard/ apps/web/tests/linear-settings.test.ts
git commit -m "feat(web): add Linear settings UI card and post issue modal"
```

---

### Task 7: End-to-End System Verification & Documentation (`@docs/`)

**Files:**
- Create: `@docs/integrations-linear.md`
- Modify: `README.md`
- Verify: Full test suites and build

**Interfaces:**
- Consumes: Seluruh komponen monorepo
- Produces: Dokumentasi lengkap dan verifikasi lolos CI

- [ ] **Step 1: Create documentation in `@docs/integrations-linear.md`**

Tulis dokumentasi teknis panduan menghubungkan Linear ke Katauser untuk pengguna self-hosted (Personal API Key, Webhook URL setup di Linear Settings, status auto-completion).

- [ ] **Step 2: Update `README.md` features overview**

Tambahkan highlight fitur *"Linear 2-Way Issue Sync"* pada daftar fitur utama di `README.md`.

- [ ] **Step 3: Run full monorepo checks and tests**

Run: `pnpm check && pnpm test && pnpm build`  
Expected: All packages pass type-check, tests, and build.

- [ ] **Step 4: Commit**

```bash
git add @docs/integrations-linear.md README.md
git commit -m "docs: add Linear integration user guide and update README"
```
