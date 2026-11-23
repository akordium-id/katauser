import { describe, it, expect, beforeEach, vi } from "vitest"
import { createWidgetState, type ChangelogSummary } from "../src/sdk"

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

    const release: ChangelogSummary = {
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
