import { describe, it, expect } from "vitest"
import { createWidgetState } from "../src/sdk"
import { Katauser } from "../src/index"

describe("Katauser Widget State & SDK Core", () => {
  it("initializes with default closed state and feedback tab", () => {
    const state = createWidgetState()
    expect(state.isOpen).toBe(false)
    expect(state.activeTab).toBe("feedback")
    expect(state.unreadCount).toBe(0)
  })

  it("toggles open and closed state", () => {
    const state = createWidgetState()
    state.open()
    expect(state.isOpen).toBe(true)

    state.close()
    expect(state.isOpen).toBe(false)

    state.toggle()
    expect(state.isOpen).toBe(true)
  })

  it("switches between tabs", () => {
    const state = createWidgetState()
    state.setActiveTab("roadmap")
    expect(state.activeTab).toBe("roadmap")

    state.setActiveTab("changelog")
    expect(state.activeTab).toBe("changelog")

    state.setActiveTab("messages")
    expect(state.activeTab).toBe("messages")
  })

  it("provides high-level Katauser SDK methods", () => {
    Katauser.init({ workspace: "kata-inc", apiUrl: "http://localhost:3000" })
    expect(Katauser.state.workspaceId).toBe("kata-inc")

    Katauser.open()
    expect(Katauser.state.isOpen).toBe(true)

    Katauser.close()
    expect(Katauser.state.isOpen).toBe(false)

    Katauser.setTab("changelog")
    expect(Katauser.state.activeTab).toBe("changelog")
  })
})
