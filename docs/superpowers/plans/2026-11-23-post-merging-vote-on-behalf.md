# Post Merging & Vote on Behalf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement feedback deduplication via Post Merging (soft merge with voter deduplication & MRR preservation) and B2B customer vote attribution via Vote on Behalf in Katauser.

**Architecture:** 
1. DB & Shared: Extend `posts` table with `mergedIntoPostId` and `votes` table with `votedByTeamUserId` & `internalNote`. Add Zod input validation schemas and include `'merged'` in `POST_STATUSES`.
2. Repository: Implement atomic `mergePosts` (deduplicating voters, updating vote counters & MRR, marking source post as `'merged'`) and `voteOnBehalf` (upserting `endUsers` and recording admin-attributed votes).
3. API: Hono endpoints `POST /posts/:postId/merge` and `POST /posts/:postId/vote-on-behalf` with proper HTTP status codes (200, 201, 400, 404, 409).
4. Web UI: Svelte 5 Runes components `MergePostModal.svelte`, `VoteOnBehalfModal.svelte`, and merged post info banner on public portal.

**Tech Stack:** Drizzle ORM (PostgreSQL), Hono, Zod, Svelte 5 (Runes, TailwindCSS, daisyUI), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-post-merging-vote-on-behalf-design.md`

## Global Constraints
- Database: Drizzle ORM with PostgreSQL.
- Framework: Svelte 5 with Runes (`$state`, `$derived`, `$props`).
- Error Handling: Return 400 for self-merge/circular merge, 404 for missing post, 409 for duplicate voter on behalf.
- Coding Style: Strict TypeScript, no any, adhere to monorepo package boundaries (`packages/db`, `packages/shared`, `apps/api`, `apps/web`).

## Review Focus
1. Self-merging condition: A post cannot be merged into itself (`sourcePostId === targetPostId` -> HTTP 400).
2. Circular/Chained merge condition: Merging into a post that is already merged must be rejected (`targetPost.mergedIntoPostId != null` -> HTTP 400).
3. Voter deduplication: If a voter has voted on both source and target posts, merging does not produce duplicate votes on the target post or violate unique constraints.
4. Duplicate vote on behalf: Attempting to vote on behalf of a customer who already voted on the post returns HTTP 409 Conflict.
5. MRR Calculation integrity: MRR contribution of transferred voters must be reflected in target post's `totalMrr`.

---

### Task 1: Database Schema & Shared Schemas

**Files:**
- Modify: `packages/db/src/schema/feedback.ts`
- Modify: `packages/shared/src/schemas/feedback.ts`
- Test: `packages/shared/tests/merge-behalf-schemas.test.ts`

**Interfaces:**
- Consumes: Existing `posts` and `votes` tables in `packages/db/src/schema/feedback.ts`.
- Produces: `mergePostsSchema`, `voteOnBehalfSchema`, and updated `POST_STATUSES` with `'merged'`.

- [ ] **Step 1: Write the failing test**
Create `packages/shared/tests/merge-behalf-schemas.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import {
  mergePostsSchema,
  voteOnBehalfSchema,
  POST_STATUSES,
} from "../src/schemas/feedback"

describe("Post Merging and Vote on Behalf Schemas", () => {
  it("includes 'merged' in POST_STATUSES", () => {
    expect(POST_STATUSES).toContain("merged")
  })

  it("validates mergePostsSchema", () => {
    expect(mergePostsSchema.safeParse({ targetPostId: "post_123" }).success).toBe(true)
    expect(mergePostsSchema.safeParse({ targetPostId: "" }).success).toBe(false)
    expect(mergePostsSchema.safeParse({}).success).toBe(false)
  })

  it("validates voteOnBehalfSchema", () => {
    const valid = {
      customerEmail: "user@example.com",
      customerName: "John Doe",
      company: "Acme Corp",
      mrr: 1500,
      internalNote: "Customer requested on sales demo",
    }
    expect(voteOnBehalfSchema.safeParse(valid).success).toBe(true)

    // Optional fields omitted
    expect(
      voteOnBehalfSchema.safeParse({ customerEmail: "user@example.com" }).success,
    ).toBe(true)

    // Invalid email
    expect(
      voteOnBehalfSchema.safeParse({ customerEmail: "invalid-email" }).success,
    ).toBe(false)

    // Negative MRR
    expect(
      voteOnBehalfSchema.safeParse({
        customerEmail: "user@example.com",
        mrr: -100,
      }).success,
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @katauser/shared test packages/shared/tests/merge-behalf-schemas.test.ts`
Expected: FAIL (modules/properties not yet defined).

- [ ] **Step 3: Implement database schema changes and shared schemas**
1. In `packages/db/src/schema/feedback.ts`:
   - Add `mergedIntoPostId: text("merged_into_post_id")` to `posts`.
   - Add `votedByTeamUserId: text("voted_by_team_user_id").references(() => users.id, { onDelete: "set null" })` and `internalNote: text("internal_note")` to `votes`.
2. In `packages/shared/src/schemas/feedback.ts`:
   - Add `"merged"` to `POST_STATUSES`.
   - Define and export `mergePostsSchema` and `voteOnBehalfSchema`.
   - Export types `MergePostsInput` and `VoteOnBehalfInput`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @katauser/shared test packages/shared/tests/merge-behalf-schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/db/src/schema/feedback.ts packages/shared/src/schemas/feedback.ts packages/shared/tests/merge-behalf-schemas.test.ts
git commit -m "feat(db,shared): add mergedIntoPostId, vote on behalf attributes, and validation schemas"
```

---

### Task 2: Repository Operations in `packages/db`

**Files:**
- Modify: `packages/db/src/repositories/feedback.ts`
- Test: `packages/db/tests/merge-and-vote-behalf-repo.test.ts`

**Interfaces:**
- Consumes: `mergePostsSchema`, `voteOnBehalfSchema` from `@katauser/shared`.
- Produces: `FeedbackRepository.mergePosts` and `FeedbackRepository.voteOnBehalf`.

- [ ] **Step 1: Write the failing test**
Create `packages/db/tests/merge-and-vote-behalf-repo.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest"
import { FeedbackRepository } from "../src/repositories/feedback"

describe("FeedbackRepository - Merge Posts & Vote on Behalf", () => {
  let mockDb: any
  let repo: FeedbackRepository

  beforeEach(() => {
    // In-memory mock database state for repository unit tests
    const postsTable: any[] = [
      {
        id: "post_source",
        workspaceId: "ws_1",
        boardId: "board_1",
        title: "Dark theme request",
        content: "Please add dark theme",
        status: "pending",
        votesCount: 2,
        mergedIntoPostId: null,
      },
      {
        id: "post_target",
        workspaceId: "ws_1",
        boardId: "board_1",
        title: "Dark Mode Support",
        content: "Dark mode is essential",
        status: "planned",
        votesCount: 3,
        mergedIntoPostId: null,
      },
      {
        id: "post_already_merged",
        workspaceId: "ws_1",
        boardId: "board_1",
        title: "Night mode",
        content: "Night mode",
        status: "merged",
        votesCount: 0,
        mergedIntoPostId: "post_target",
      },
    ]

    const votesTable: any[] = [
      { id: "v1", workspaceId: "ws_1", postId: "post_source", endUserId: "user_a" },
      { id: "v2", workspaceId: "ws_1", postId: "post_source", endUserId: "user_common" },
      { id: "v3", workspaceId: "ws_1", postId: "post_target", endUserId: "user_common" },
      { id: "v4", workspaceId: "ws_1", postId: "post_target", endUserId: "user_b" },
      { id: "v5", workspaceId: "ws_1", postId: "post_target", endUserId: "user_c" },
    ]

    const endUsersTable: any[] = [
      { id: "user_a", workspaceId: "ws_1", email: "a@test.com", name: "User A", metadata: {} },
      { id: "user_common", workspaceId: "ws_1", email: "common@test.com", name: "User Common", metadata: {} },
    ]

    mockDb = {
      _posts: postsTable,
      _votes: votesTable,
      _endUsers: endUsersTable,
      // Minimal mock methods matching repository implementation
      transaction: async (cb: any) => cb({
        query: {
          posts: {
            findFirst: async ({ where }: any) => {
              // mock find
              return postsTable.find((p) => p.id === where?.id)
            },
          },
          votes: {
            findMany: async ({ where }: any) => votesTable.filter((v) => v.postId === where?.postId),
            findFirst: async ({ where }: any) => votesTable.find((v) => v.postId === where?.postId && v.endUserId === where?.endUserId),
          },
        },
      }),
    }
    repo = new FeedbackRepository(mockDb)
  })

  it("rejects self-merge with 400 error", async () => {
    await expect(
      repo.mergePosts({
        workspaceId: "ws_1",
        sourcePostId: "post_target",
        targetPostId: "post_target",
      }),
    ).rejects.toThrow("Cannot merge post into itself")
  })

  it("rejects merge if target post is already merged", async () => {
    await expect(
      repo.mergePosts({
        workspaceId: "ws_1",
        sourcePostId: "post_source",
        targetPostId: "post_already_merged",
      }),
    ).rejects.toThrow("Target post is already merged")
  })

  it("rejects vote on behalf if customer already voted", async () => {
    await expect(
      repo.voteOnBehalf({
        workspaceId: "ws_1",
        postId: "post_source",
        teamUserId: "staff_1",
        customerEmail: "a@test.com",
      }),
    ).rejects.toThrow("Customer has already voted on this post")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @katauser/db test packages/db/tests/merge-and-vote-behalf-repo.test.ts`
Expected: FAIL (`mergePosts` / `voteOnBehalf` not implemented).

- [ ] **Step 3: Implement `mergePosts` and `voteOnBehalf` in `FeedbackRepository`**
In `packages/db/src/repositories/feedback.ts`:
1. Implement `mergePosts(params: { workspaceId: string, sourcePostId: string, targetPostId: string })`:
   - Validate `sourcePostId !== targetPostId`
   - Fetch source and target posts; verify workspace match and target post is not merged
   - Deduplicate votes: query existing voters on target post. Move non-duplicate votes from source to target post. Remove duplicate votes from source.
   - Update target post: increment `votesCount` by transferred voters count.
   - Update source post: set `status = "merged"`, `mergedIntoPostId = targetPostId`, `votesCount = 0`.
   - Insert internal comment on target post: `Post "${sourcePost.title}" was merged into this post.`
2. Implement `voteOnBehalf(params: { workspaceId: string, postId: string, teamUserId: string, customerEmail: string, customerName?: string, company?: string, mrr?: number, internalNote?: string })`:
   - Find or create `endUsers` record for `(workspaceId, customerEmail)` with metadata `{ mrr, company }`.
   - Check if vote already exists for `(postId, endUserId)`. Throw error if exists.
   - Insert vote into `votes` table with `votedByTeamUserId` and `internalNote`.
   - Update `votesCount` on post.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @katauser/db test packages/db/tests/merge-and-vote-behalf-repo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/db/src/repositories/feedback.ts packages/db/tests/merge-and-vote-behalf-repo.test.ts
git commit -m "feat(db): implement mergePosts and voteOnBehalf repository operations"
```

---

### Task 3: API Endpoints in `apps/api`

**Files:**
- Modify: `apps/api/src/modules/feedback/posts.route.ts`
- Test: `apps/api/tests/merge-and-vote-behalf.test.ts`

**Interfaces:**
- Consumes: `mergePostsSchema`, `voteOnBehalfSchema` from `@katauser/shared`.
- Produces: `POST /posts/:postId/merge`, `POST /posts/:postId/vote-on-behalf`, and enhanced `GET /posts/:postId` (supporting `mergedInto`).

- [ ] **Step 1: Write the failing test**
Create `apps/api/tests/merge-and-vote-behalf.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { postsRoute } from "../src/modules/feedback/posts.route"

describe("Posts Merging & Vote on Behalf API Routes", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono().route("/", postsRoute)
  })

  it("POST /posts/:postId/merge returns 400 when merging post into itself", async () => {
    const res = await app.request("/posts/post_1/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPostId: "post_1" }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Cannot merge post into itself")
  })

  it("POST /posts/:postId/vote-on-behalf succeeds and increases votes count and MRR", async () => {
    // 1. Create a post
    const createRes = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "SSO SAML Integration",
        content: "Need Okta/SAML support for enterprise",
      }),
    })
    const { post } = await createRes.json()

    // 2. Vote on behalf
    const voteRes = await app.request(`/posts/${post.id}/vote-on-behalf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-team-user-id": "staff_lead_1",
      },
      body: JSON.stringify({
        customerEmail: "cto@megacorp.com",
        customerName: "Alice Megacorp",
        company: "MegaCorp Inc",
        mrr: 2500,
        internalNote: "Deal breaker for 200 seat enterprise contract",
      }),
    })
    expect(voteRes.status).toBe(201)
    const voteData = await voteRes.json()
    expect(voteData.success).toBe(true)
    expect(voteData.post.votesCount).toBe(1)
    expect(voteData.post.totalMrr).toBe(2500)
    expect(voteData.vote.customerEmail).toBe("cto@megacorp.com")
    expect(voteData.vote.votedByTeamUserId).toBe("staff_lead_1")

    // 3. Repeat vote with same customer returns 409 Conflict
    const dupRes = await app.request(`/posts/${post.id}/vote-on-behalf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-team-user-id": "staff_lead_1",
      },
      body: JSON.stringify({
        customerEmail: "cto@megacorp.com",
      }),
    })
    expect(dupRes.status).toBe(409)
  })

  it("POST /posts/:postId/merge merges source into target post with voter deduplication", async () => {
    // Create target post
    const targetRes = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "Export to CSV",
        content: "Enable CSV download",
      }),
    })
    const { post: targetPost } = await targetRes.json()

    // Create source post
    const sourceRes = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "Download data as Excel/CSV",
        content: "We need data export",
      }),
    })
    const { post: sourcePost } = await sourceRes.json()

    // Vote on source post
    await app.request(`/posts/${sourcePost.id}/vote-on-behalf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail: "voter1@test.com",
        mrr: 400,
      }),
    })

    // Execute merge
    const mergeRes = await app.request(`/posts/${sourcePost.id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPostId: targetPost.id }),
    })
    expect(mergeRes.status).toBe(200)
    const mergeData = await mergeRes.json()
    expect(mergeData.success).toBe(true)
    expect(mergeData.targetPost.votesCount).toBe(1)
    expect(mergeData.targetPost.totalMrr).toBe(400)
    expect(mergeData.transferredVotesCount).toBe(1)

    // Check source post status
    const getSourceRes = await app.request(`/posts/${sourcePost.id}`)
    const getSourceData = await getSourceRes.json()
    expect(getSourceData.post.status).toBe("merged")
    expect(getSourceData.post.mergedIntoPostId).toBe(targetPost.id)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @katauser/api test apps/api/tests/merge-and-vote-behalf.test.ts`
Expected: FAIL (routes not defined).

- [ ] **Step 3: Implement endpoints in `apps/api/src/modules/feedback/posts.route.ts`**
1. Update `PostRecord` to include `mergedIntoPostId?: string`.
2. Update `VoteRecord` to include `votedByTeamUserId?: string` and `internalNote?: string`.
3. Add `GET /posts/:postId`:
   - Returns post with `mergedInto` summary if `status === 'merged'`.
4. Add `POST /posts/:postId/merge`:
   - Validate with `zValidator("json", mergePostsSchema)`.
   - Reject self-merge (`postId === targetPostId` -> 400).
   - Find source and target post in `postsStore` / DB.
   - Reject if source post not found or target post not found -> 404.
   - Reject if target post already has `mergedIntoPostId` or `status === 'merged'` -> 400.
   - Transfer votes: for each vote in `votesStore` where `postId === sourcePostId`, check if voter (`userId` / `userEmail`) already exists for `targetPostId`. If not, change `vote.postId = targetPostId`. If already exists, remove duplicate vote.
   - Recalculate `votesCount` and `totalMrr` on target post.
   - Set source post `status = "merged"` and `mergedIntoPostId = targetPostId`, reset `votesCount = 0`, `totalMrr = 0`.
   - Append internal comment to `commentsStore` for target post: `Post "${sourcePost.title}" was merged into this post.`
   - Return `{ success: true, targetPost, transferredVotesCount, transferredMrr }`.
5. Add `POST /posts/:postId/vote-on-behalf`:
   - Validate with `zValidator("json", voteOnBehalfSchema)`.
   - Check if post exists -> 404.
   - Check if voter with `userEmail` already voted on this post in `votesStore` -> 409 Conflict.
   - Extract team user from header `x-team-user-id` or default `"staff"`.
   - Push new `VoteRecord` with `postId`, `userId: "enduser_" + email`, `userEmail`, `traits: { mrr, company }`, `votedByTeamUserId`, `internalNote`.
   - Update post `votesCount += 1`, recalculate `totalMrr`.
   - Return `{ success: true, post, vote }`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @katauser/api test apps/api/tests/merge-and-vote-behalf.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/api/src/modules/feedback/posts.route.ts apps/api/tests/merge-and-vote-behalf.test.ts
git commit -m "feat(api): implement post merge and vote-on-behalf endpoints"
```

---

### Task 4: Frontend UI Components & Helpers

**Files:**
- Create: `apps/web/src/lib/merge-helpers.ts`
- Create: `apps/web/src/lib/components/dashboard/MergePostModal.svelte`
- Create: `apps/web/src/lib/components/dashboard/VoteOnBehalfModal.svelte`
- Modify: `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/+page.svelte`
- Test: `apps/web/tests/merge-and-vote-behalf-ui.test.ts`

**Interfaces:**
- Consumes: `mergePostsSchema`, `voteOnBehalfSchema` from `@katauser/shared`.
- Produces: UI modal components and helper functions for validation and display.

- [ ] **Step 1: Write the failing test**
Create `apps/web/tests/merge-and-vote-behalf-ui.test.ts`:
```ts
import { describe, it, expect } from "vitest"
import {
  validateMergeTarget,
  calculateMergedSummary,
  formatVoteOnBehalfPayload,
} from "../src/lib/merge-helpers"

describe("Merge & Vote on Behalf UI Helpers", () => {
  it("validateMergeTarget flags invalid selections", () => {
    expect(validateMergeTarget("p1", "p1")).toEqual({
      valid: false,
      error: "Tidak dapat menggabungkan post ke dirinya sendiri",
    })

    expect(validateMergeTarget("p1", "")).toEqual({
      valid: false,
      error: "Pilih post target tujuan",
    })

    expect(validateMergeTarget("p1", "p2")).toEqual({
      valid: true,
      error: null,
    })
  })

  it("calculateMergedSummary combines votes and MRR correctly", () => {
    const summary = calculateMergedSummary(
      { votesCount: 5, totalMrr: 1000 },
      { votesCount: 3, totalMrr: 500 },
    )
    expect(summary.combinedVotes).toBe(8)
    expect(summary.combinedMrr).toBe(1500)
    expect(summary.formattedMrr).toBe("$1,500")
  })

  it("formatVoteOnBehalfPayload cleans and converts input data", () => {
    const payload = formatVoteOnBehalfPayload({
      customerEmail: "  client@corp.com  ",
      customerName: "  Pak Budi ",
      company: " PT Jaya ",
      mrrStr: "750",
      internalNote: " Requested via meeting ",
    })
    expect(payload.customerEmail).toBe("client@corp.com")
    expect(payload.customerName).toBe("Pak Budi")
    expect(payload.company).toBe("PT Jaya")
    expect(payload.mrr).toBe(750)
    expect(payload.internalNote).toBe("Requested via meeting")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm --filter @katauser/web test apps/web/tests/merge-and-vote-behalf-ui.test.ts`
Expected: FAIL (helper file does not exist).

- [ ] **Step 3: Implement helper and Svelte 5 components**
1. Create `apps/web/src/lib/merge-helpers.ts` with `validateMergeTarget`, `calculateMergedSummary`, and `formatVoteOnBehalfPayload`.
2. Create `apps/web/src/lib/components/dashboard/MergePostModal.svelte`:
   - Svelte 5 runes (`let { isOpen, sourcePost, boardPosts, onMerge, onClose } = $props()`).
   - Allows selecting target post from dropdown or search query.
   - Displays preview of source post vs target post and calculated combined stats.
   - Emits `onMerge(targetPostId)`.
3. Create `apps/web/src/lib/components/dashboard/VoteOnBehalfModal.svelte`:
   - Svelte 5 runes form (`customerEmail`, `customerName`, `company`, `mrrStr`, `internalNote`).
   - Validates email and MRR input.
   - Emits `onSubmit(payload)`.
4. Update `apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/+page.svelte`:
   - Import and integrate `MergePostModal` and `VoteOnBehalfModal`.
   - Provide triggers in the board view.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm --filter @katauser/web test apps/web/tests/merge-and-vote-behalf-ui.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/lib/merge-helpers.ts apps/web/src/lib/components/dashboard/MergePostModal.svelte apps/web/src/lib/components/dashboard/VoteOnBehalfModal.svelte apps/web/src/routes/(admin)/dashboard/[workspaceSlug]/boards/+page.svelte apps/web/tests/merge-and-vote-behalf-ui.test.ts
git commit -m "feat(web): add merge post and vote on behalf modals and helpers"
```

---

### Task 5: Public Portal Merged Banner & Documentation

**Files:**
- Modify: `apps/web/src/routes/(public)/b/[workspaceSlug]/[boardSlug]/+page.svelte`
- Create: `docs/features/post-merging-and-vote-on-behalf.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Post status `'merged'` and `mergedIntoPostId` on post items.
- Produces: Public banner on merged posts and technical documentation for users and developers.

- [ ] **Step 1: Update public board page to display merged post banner**
In `apps/web/src/routes/(public)/b/[workspaceSlug]/[boardSlug]/+page.svelte`:
If a post has `status === 'merged'`, display an informational banner:
```html
{#if post.status === 'merged'}
  <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 mb-3 flex items-center justify-between">
    <span>Postingan ini telah digabungkan ke masukan utama.</span>
    <span class="badge badge-warning badge-sm font-semibold">Tergabung</span>
  </div>
{/if}
```

- [ ] **Step 2: Create feature documentation**
Create `docs/features/post-merging-and-vote-on-behalf.md`:
Document how Post Merging works, deduplication logic, MRR consolidation, how Sales/CS use Vote on Behalf, and API endpoint reference. Update `README.md` to highlight Post Merging & Vote on Behalf in the feature list.

- [ ] **Step 3: Run monorepo typecheck and test verification**
Run: `pnpm check && pnpm test`
Expected: 0 errors, 0 warnings across all packages. All unit and integration tests passing.

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/routes/(public)/b/[workspaceSlug]/[boardSlug]/+page.svelte docs/features/post-merging-and-vote-on-behalf.md README.md
git commit -m "docs: add post merging and vote on behalf guide and public portal banner"
```
