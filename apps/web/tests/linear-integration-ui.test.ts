import { describe, it, expect } from "vitest"
import {
  validateLinearApiKey,
  formatLinearIdentifier,
  getLinearPriorityLabel,
} from "../src/lib/integrations-helpers"

describe("Linear Integration UI Helpers", () => {
  it("validates Linear API Key format", () => {
    expect(validateLinearApiKey("lin_api_abcdef123456").valid).toBe(true)
    expect(validateLinearApiKey("").valid).toBe(false)
    expect(validateLinearApiKey("short").valid).toBe(false)
    expect(validateLinearApiKey("invalid_prefix_token_123").valid).toBe(false)
  })

  it("formats Linear issue identifier to uppercase", () => {
    expect(formatLinearIdentifier("eng-142")).toBe("ENG-142")
    expect(formatLinearIdentifier("prod-99")).toBe("PROD-99")
    expect(formatLinearIdentifier("  lin-1  ")).toBe("LIN-1")
  })

  it("returns correct Linear priority label and badge colors", () => {
    expect(getLinearPriorityLabel(0).label).toBe("No priority")
    expect(getLinearPriorityLabel(1).label).toBe("Urgent")
    expect(getLinearPriorityLabel(2).label).toBe("High")
    expect(getLinearPriorityLabel(3).label).toBe("Medium")
    expect(getLinearPriorityLabel(4).label).toBe("Low")
  })
})
