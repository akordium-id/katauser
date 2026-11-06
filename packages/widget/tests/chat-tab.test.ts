import { describe, it, expect } from "vitest"
import {
  parseSSEChunk,
  formatMessageTime,
  isEscalationRequested,
} from "../src/chat-helpers"

describe("Chat Helpers in Widget", () => {
  it("parses text chunks from SSE stream data payload", () => {
    const rawLine = 'data: {"text":"Halo! Saya Juno."}'
    expect(parseSSEChunk(rawLine)).toBe("Halo! Saya Juno.")

    const doneLine = "data: [DONE]"
    expect(parseSSEChunk(doneLine)).toBeNull()
  })

  it("detects intent to escalate to human agent", () => {
    expect(isEscalationRequested("Saya ingin bicara dengan staf manusia")).toBe(
      true,
    )
    expect(isEscalationRequested("bisa hubungi admin?")).toBe(true)
    expect(isEscalationRequested("Bagaimana cara integrasi webhook?")).toBe(
      false,
    )
  })

  it("formats message timestamps gracefully", () => {
    const timeStr = formatMessageTime("2026-11-06T10:15:00.000Z")
    expect(typeof timeStr).toBe("string")
    expect(timeStr.length).toBeGreaterThan(0)
  })
})
