# In-App Changelog Popover & Unread Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement floating in-app changelog teaser popover and unread badge on `<katauser-widget>` with client-side read persistence and API sync.

**Architecture:**

1. API & DB: Add `GET /workspaces/:slug/changelogs/latest?since=<isoDate>` endpoint in Hono to return latest release and compute unread count.
2. Widget Helpers: Pure helper functions in `packages/widget/src/changelog-helpers.ts` for storage persistence (`localStorage`), unread release calculation, and popover display logic.
3. Widget SDK: Extend `createWidgetState()` in `packages/widget/src/sdk.ts` to manage `latestChangelog`, `isPopoverDismissed`, and auto-fetch/mark-as-read workflows.
4. Widget UI: Build `ChangelogPopover.svelte` (Shadow DOM floating teaser card positioned above `TriggerButton`) and integrate into `KatauserWidget.svelte`.

**Tech Stack:** Hono, Drizzle ORM, Svelte 5 (Runes, Shadow DOM Web Component), TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-in-app-changelog-popover-design.md`

## Global Constraints

- Framework: Svelte 5 with Runes (`$state`, `$derived`, `$props`, `$effect`).
- Web Component: Encapsulated styles within Shadow DOM; no leak of styles to host document.
- Zero-dependency client: Pure fetch without external HTTP client libraries.
- Error Handling: Graceful fallback if API fails (badge remains 0, popover suppressed).

## Review Focus

1. Storage safety: Safe fallback if `window.localStorage` is unavailable (e.g., incognito security restrictions or SSR context).
2. Date parsing robustness: Handling invalid or future `since` query parameters safely without NaN or server crash.
3. Shadow DOM styling: Ensure popover does not collide with host application z-index or overflow boundaries.
4. Auto-dismiss & read sync: Opening the changelog tab must immediately clear the badge and update the stored `lastSeenAt`.
5. Escape & accessibility: Popover dismiss button must have clear `aria-label` and keyboard accessibility.

---

### Task 1: API Endpoint & Database Repository

**Files:**

- Modify: `packages/db/src/repositories/changelog.ts`
- Modify: `apps/api/src/modules/changelog/changelog.route.ts`
- Test: `apps/api/tests/changelog-unread.test.ts`

**Interfaces:**

- Consumes: Existing `changelogs` schema.
- Produces: `GET /api/v1/workspaces/:slug/changelogs/latest` returning `{ success: boolean, latest: Changelog | null, unreadCount: number, hasUnread: boolean }`.

- [ ] **Step 1: Write the failing test**
      Create `apps/api/tests/changelog-unread.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { changelogRoute } from "../src/modules/changelog/changelog.route"

describe("Changelog Latest & Unread API", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono().route("/", changelogRoute)
  })

  it("returns latest changelog and unreadCount when releases exist", async () => {
    // 1. Create older release
    await app.request("/workspaces/acme/changelogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Release v1.0.0",
        slug: "v1-0-0",
        content: "Initial public launch",
        publishedAt: "2026-11-01T10:00:00.000Z",
      }),
    })

    // 2. Create newer release
    await app.request("/workspaces/acme/changelogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Release v1.1.0",
        slug: "v1-1-0",
        content: "Roadmap Kanban & Dark mode",
        publishedAt: "2026-11-20T10:00:00.000Z",
      }),
    })

    // 3. Query latest without since parameter (returns all published as unread)
    const resAll = await app.request("/workspaces/acme/changelogs/latest")
    expect(resAll.status).toBe(200)
    const dataAll = await resAll.json()
    expect(dataAll.success).toBe(true)
    expect(dataAll.latest).toBeDefined()
    expect(dataAll.latest.slug).toBe("v1-1-0")
    expect(dataAll.unreadCount).toBeGreaterThanOrEqual(2)
    expect(dataAll.hasUnread).toBe(true)

    // 4. Query with since = date between releases
    const resSince = await app.request(
      "/workspaces/acme/changelogs/latest?since=2026-11-15T00:00:00.000Z",
    )
    expect(resSince.status).toBe(200)
    const dataSince = await resSince.json()
    expect(dataSince.unreadCount).toBe(1)
    expect(dataSince.hasUnread).toBe(true)

    // 5. Query with since = date after latest release
    const resCaughtUp = await app.request(
      "/workspaces/acme/changelogs/latest?since=2026-11-23T00:00:00.000Z",
    )
    expect(resCaughtUp.status).toBe(200)
    const dataCaughtUp = await resCaughtUp.json()
    expect(dataCaughtUp.unreadCount).toBe(0)
    expect(dataCaughtUp.hasUnread).toBe(false)
  })

  it("returns latest null and unreadCount 0 when workspace has no changelogs", async () => {
    const res = await app.request(
      "/workspaces/empty_workspace/changelogs/latest",
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.latest).toBeNull()
    expect(data.unreadCount).toBe(0)
    expect(data.hasUnread).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @katauser/api test -- tests/changelog-unread.test.ts`
      Expected: FAIL (endpoint `/workspaces/:slug/changelogs/latest` returns 404).

- [ ] **Step 3: Implement endpoint in `apps/api/src/modules/changelog/changelog.route.ts`**
      Add route `GET /workspaces/:slug/changelogs/latest`:
- Extract `slug` and optional `since` query param.
- Filter releases matching `workspaceId === slug` and sort descending by `publishedAt`.
- Pick latest published release.
- If `since` is present and is a valid date, calculate `unreadCount` as count of releases where `new Date(r.publishedAt) > new Date(since)`.
- Otherwise, `unreadCount = Math.min(filtered.length, 5)`.
- Return `{ success: true, latest, unreadCount, hasUnread: unreadCount > 0 }`.

- [ ] **Step 4: Run test to verify it passes**
      Run: `pnpm --filter @katauser/api test -- tests/changelog-unread.test.ts`
      Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/changelog/changelog.route.ts apps/api/tests/changelog-unread.test.ts
git commit -m "feat(api): add latest and unread changelog endpoint"
```

---

### Task 2: Widget Changelog Helpers

**Files:**

- Create: `packages/widget/src/changelog-helpers.ts`
- Test: `packages/widget/tests/changelog-helpers.test.ts`

**Interfaces:**

- Produces: `getStoredLastSeenDate`, `storeLastSeenDate`, `calculateUnreadCount`, `shouldDisplayPopover`.

- [ ] **Step 1: Write the failing test**
      Create `packages/widget/tests/changelog-helpers.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import {
  getStoredLastSeenDate,
  storeLastSeenDate,
  calculateUnreadCount,
  shouldDisplayPopover,
} from "../src/changelog-helpers"

describe("Widget Changelog Helpers", () => {
  let mockStorage: Record<string, string>
  let storage: Storage

  beforeEach(() => {
    mockStorage = {}
    storage = {
      getItem: (k: string) => mockStorage[k] ?? null,
      setItem: (k: string, v: string) => {
        mockStorage[k] = v
      },
      removeItem: (k: string) => {
        delete mockStorage[k]
      },
      clear: () => {
        mockStorage = {}
      },
      length: 0,
      key: () => null,
    }
  })

  it("stores and retrieves last seen changelog date", () => {
    expect(getStoredLastSeenDate("acme", storage)).toBeNull()

    const nowIso = "2026-11-23T10:00:00.000Z"
    storeLastSeenDate("acme", nowIso, storage)

    expect(getStoredLastSeenDate("acme", storage)).toBe(nowIso)
  })

  it("calculateUnreadCount filters releases published after sinceDate", () => {
    const releases = [
      { publishedAt: "2026-11-20T10:00:00.000Z" },
      { publishedAt: "2026-11-15T10:00:00.000Z" },
      { publishedAt: "2026-11-01T10:00:00.000Z" },
    ]

    expect(calculateUnreadCount(releases, null)).toBe(3)
    expect(calculateUnreadCount(releases, "2026-11-10T00:00:00.000Z")).toBe(2)
    expect(calculateUnreadCount(releases, "2026-11-21T00:00:00.000Z")).toBe(0)
  })

  it("shouldDisplayPopover respects open, unread, dismissed, and config flags", () => {
    expect(
      shouldDisplayPopover({
        isOpen: false,
        unreadCount: 1,
        isDismissed: false,
        showPopover: true,
      }),
    ).toBe(true)

    // Hidden if widget panel is open
    expect(
      shouldDisplayPopover({
        isOpen: true,
        unreadCount: 1,
        isDismissed: false,
        showPopover: true,
      }),
    ).toBe(false)

    // Hidden if unreadCount is 0
    expect(
      shouldDisplayPopover({
        isOpen: false,
        unreadCount: 0,
        isDismissed: false,
        showPopover: true,
      }),
    ).toBe(false)

    // Hidden if dismissed
    expect(
      shouldDisplayPopover({
        isOpen: false,
        unreadCount: 2,
        isDismissed: true,
        showPopover: true,
      }),
    ).toBe(false)

    // Hidden if showPopover is false
    expect(
      shouldDisplayPopover({
        isOpen: false,
        unreadCount: 2,
        isDismissed: false,
        showPopover: false,
      }),
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @katauser/widget test -- tests/changelog-helpers.test.ts`
      Expected: FAIL (file not found).

- [ ] **Step 3: Implement `packages/widget/src/changelog-helpers.ts`**
      Implement the 4 helper functions with safe handling for missing storage or exceptions (try-catch around `storage.getItem` and `storage.setItem`).

- [ ] **Step 4: Run test to verify it passes**
      Run: `pnpm --filter @katauser/widget test -- tests/changelog-helpers.test.ts`
      Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/widget/src/changelog-helpers.ts packages/widget/tests/changelog-helpers.test.ts
git commit -m "feat(widget): add changelog storage and unread calculation helpers"
```

---

### Task 3: Widget State Manager & SDK Methods

**Files:**

- Modify: `packages/widget/src/sdk.ts`
- Test: `packages/widget/tests/sdk-changelog.test.ts`

**Interfaces:**

- Consumes: `changelog-helpers.ts`.
- Produces: `globalWidgetState.latestChangelog`, `globalWidgetState.isPopoverDismissed`, `globalWidgetState.showPopover`, `globalWidgetState.markChangelogAsRead()`, `globalWidgetState.dismissPopover()`.

- [ ] **Step 1: Write the failing test**
      Create `packages/widget/tests/sdk-changelog.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest"
import { createWidgetState } from "../src/sdk"

describe("Widget State - Changelog & Popover", () => {
  let state: ReturnType<typeof createWidgetState>

  beforeEach(() => {
    state = createWidgetState()
  })

  it("initializes with default changelog state", () => {
    expect(state.latestChangelog).toBeNull()
    expect(state.isPopoverDismissed).toBe(false)
    expect(state.showPopover).toBe(true)
  })

  it("updates latest changelog and triggers subscribers", () => {
    const subscriber = vi.fn()
    state.subscribe(subscriber)

    const release = {
      id: "ch_1",
      title: "v1.2.0",
      slug: "v1-2-0",
      content: "Notes",
      publishedAt: "2026-11-23T10:00:00.000Z",
    }
    state.setLatestChangelog(release)

    expect(state.latestChangelog).toEqual(release)
    expect(subscriber).toHaveBeenCalled()
  })

  it("dismissPopover sets isPopoverDismissed to true", () => {
    state.dismissPopover()
    expect(state.isPopoverDismissed).toBe(true)
  })

  it("markChangelogAsRead clears unreadCount and stores date", () => {
    state.setUnreadCount(3)
    expect(state.unreadCount).toBe(3)

    state.markChangelogAsRead("acme", "2026-11-23T10:00:00.000Z")

    expect(state.unreadCount).toBe(0)
    expect(state.isPopoverDismissed).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @katauser/widget test -- tests/sdk-changelog.test.ts`
      Expected: FAIL (methods and fields not yet on `createWidgetState`).

- [ ] **Step 3: Implement changelog properties and methods in `packages/widget/src/sdk.ts`**
      Update `createWidgetState()` to manage `latestChangelog`, `isPopoverDismissed`, `showPopover`, `setLatestChangelog()`, `dismissPopover()`, `markChangelogAsRead()`, and `syncChangelogStatus()`.

- [ ] **Step 4: Run test to verify it passes**
      Run: `pnpm --filter @katauser/widget test -- tests/sdk-changelog.test.ts`
      Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/widget/src/sdk.ts packages/widget/tests/sdk-changelog.test.ts
git commit -m "feat(widget): extend SDK state with changelog popover management"
```

---

### Task 4: Svelte 5 Popover Component & Widget Integration

**Files:**

- Create: `packages/widget/src/components/ChangelogPopover.svelte`
- Modify: `packages/widget/src/KatauserWidget.svelte`
- Modify: `packages/widget/src/components/WidgetPanel.svelte`
- Test: `packages/widget/tests/changelog-popover.test.ts`

**Interfaces:**

- Consumes: `shouldDisplayPopover` and `globalWidgetState`.
- Produces: Visual floating card in `<katauser-widget>` Shadow DOM.

- [ ] **Step 1: Write test for popover display logic and props**
      Create `packages/widget/tests/changelog-popover.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { shouldDisplayPopover } from "../src/changelog-helpers"

describe("ChangelogPopover Component Logic", () => {
  it("determines popover visibility correctly", () => {
    const visible = shouldDisplayPopover({
      isOpen: false,
      unreadCount: 1,
      isDismissed: false,
      showPopover: true,
    })
    expect(visible).toBe(true)
  })
})
```

- [ ] **Step 2: Implement `packages/widget/src/components/ChangelogPopover.svelte`**
      Svelte 5 runes component:
- Props: `latest`, `onOpen`, `onDismiss`.
- Styled floating card at `bottom: 92px`, `right: 24px` with smooth CSS animation.
- Title, truncated description preview, badge "Pembaruan Baru", dismiss button `✕`, and action button "Lihat Rilis Baru →".

- [ ] **Step 3: Integrate into `packages/widget/src/KatauserWidget.svelte`**
- Mount `<ChangelogPopover>` inside `.katauser-host`.
- When user clicks "Lihat Rilis Baru", open widget panel, set activeTab to `'changelog'`, and call `markChangelogAsRead`.
- Automatically trigger `syncChangelogStatus(workspace, apiUrl)` on mount in `$effect`.
- When user clicks `tab-btn` changelog in `WidgetPanel.svelte`, also mark changelog as read.

- [ ] **Step 4: Run widget tests and verify**
      Run: `pnpm --filter @katauser/widget test`
      Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/widget/src/components/ChangelogPopover.svelte packages/widget/src/KatauserWidget.svelte packages/widget/src/components/WidgetPanel.svelte packages/widget/tests/changelog-popover.test.ts
git commit -m "feat(widget): add ChangelogPopover component and mount to KatauserWidget"
```

---

### Task 5: Feature Documentation & Monorepo Verification

**Files:**

- Create: `docs/features/in-app-changelog-popover.md`
- Modify: `README.md`

- [ ] **Step 1: Write user and developer guide**
      Create `docs/features/in-app-changelog-popover.md` documenting:
- How to embed `<katauser-widget>` with changelog teaser enabled.
- How read-state tracking works in `localStorage` and server sync.
- Configuration attributes (`show-popover="false"`).
  Update `README.md` to list the feature.

- [ ] **Step 2: Run full monorepo typecheck and test verification**
      Run: `pnpm check && pnpm test`
      Expected: 0 errors, 0 warnings across all packages.

- [ ] **Step 3: Commit**

```bash
git add docs/features/in-app-changelog-popover.md README.md
git commit -m "docs: add in-app changelog popover guide and update README"
```
