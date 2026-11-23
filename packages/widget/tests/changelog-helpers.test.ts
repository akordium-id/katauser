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

  it("handles undefined, null, and prevents backward overwrite in storage", () => {
    // 1. Ignores undefined or null literals
    mockStorage["katauser_changelog_seen_acme"] = "undefined"
    expect(getStoredLastSeenDate("acme", storage)).toBeNull()

    mockStorage["katauser_changelog_seen_acme"] = "null"
    expect(getStoredLastSeenDate("acme", storage)).toBeNull()

    // 2. Ignores invalid date strings
    mockStorage["katauser_changelog_seen_acme"] = "invalid_date_abc"
    expect(getStoredLastSeenDate("acme", storage)).toBeNull()

    // 3. Store valid newer date
    const dateNew = "2026-11-23T12:00:00.000Z"
    storeLastSeenDate("acme", dateNew, storage)
    expect(getStoredLastSeenDate("acme", storage)).toBe(dateNew)

    // 4. Backward date should not overwrite newer date
    const dateOld = "2026-11-20T10:00:00.000Z"
    storeLastSeenDate("acme", dateOld, storage)
    expect(getStoredLastSeenDate("acme", storage)).toBe(dateNew)
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

    // Hidden if showPopover is false (boolean or string)
    expect(
      shouldDisplayPopover({
        isOpen: false,
        unreadCount: 2,
        isDismissed: false,
        showPopover: false,
      }),
    ).toBe(false)

    expect(
      shouldDisplayPopover({
        isOpen: false,
        unreadCount: 2,
        isDismissed: false,
        showPopover: "false",
      }),
    ).toBe(false)
  })
})
