import { describe, it, expect } from "vitest"
import {
  getConversationStatusBadge,
  filterConversations,
} from "../src/lib/inbox-helpers"

describe("Admin Inbox UI Helpers", () => {
  it("returns proper badge for AI vs Human assigned conversations", () => {
    const aiBadge = getConversationStatusBadge("open", "ai_juno")
    expect(aiBadge.label).toBe("AI Juno")
    expect(aiBadge.color).toContain("indigo")

    const humanBadge = getConversationStatusBadge("open", "human")
    expect(humanBadge.label).toBe("Perlu Staf")
    expect(humanBadge.color).toContain("amber")

    const closedBadge = getConversationStatusBadge("closed", "human")
    expect(closedBadge.label).toBe("Selesai")
  })

  it("filters conversations by assignment category", () => {
    const conversations = [
      { id: "1", assignedTo: "ai_juno" },
      { id: "2", assignedTo: "human" },
      { id: "3", assignedTo: "ai_juno" },
    ]

    expect(filterConversations(conversations, "all").length).toBe(3)
    expect(filterConversations(conversations, "human").length).toBe(1)
    expect(filterConversations(conversations, "ai").length).toBe(2)
  })
})
