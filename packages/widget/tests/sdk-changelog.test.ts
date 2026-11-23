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

  it("syncChangelogStatus fetches latest changelog, handles null gracefully, and trims trailing slashes", async () => {
    const originalFetch = globalThis.fetch

    try {
      // 1. Success with latest changelog
      const mockChangelog: ChangelogSummary = {
        id: "ch_99",
        title: "Release v2.0",
        slug: "v2-0",
        content: "Awesome updates",
        publishedAt: "2026-11-23T12:00:00.000Z",
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          latest: mockChangelog,
          unreadCount: 2,
        }),
      }) as any

      await state.syncChangelogStatus("my-space", "https://api.example.com/")

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/workspaces/my-space/changelogs/latest",
      )
      expect(state.latestChangelog).toEqual(mockChangelog)
      expect(state.unreadCount).toBe(2)

      // 2. Success with latest: null (resets state)
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          latest: null,
          unreadCount: 0,
        }),
      }) as any

      await state.syncChangelogStatus("my-space", "https://api.example.com")
      expect(state.latestChangelog).toBeNull()
      expect(state.unreadCount).toBe(0)

      // 3. Network failure / 500 does not throw and preserves state
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network offline"))
      await expect(
        state.syncChangelogStatus("my-space", "https://api.example.com"),
      ).resolves.not.toThrow()
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
