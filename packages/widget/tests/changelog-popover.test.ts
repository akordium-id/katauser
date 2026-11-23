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

  it("hides popover when dismissed or when widget open", () => {
    expect(
      shouldDisplayPopover({
        isOpen: true,
        unreadCount: 2,
        isDismissed: false,
        showPopover: true,
      }),
    ).toBe(false)

    expect(
      shouldDisplayPopover({
        isOpen: false,
        unreadCount: 2,
        isDismissed: true,
        showPopover: true,
      }),
    ).toBe(false)
  })
})
