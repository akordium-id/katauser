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

    // Empty strings handled as undefined
    const minimal = formatVoteOnBehalfPayload({
      customerEmail: "client@corp.com",
      customerName: "   ",
      company: "",
      mrrStr: "",
      internalNote: "",
    })
    expect(minimal.customerName).toBeUndefined()
    expect(minimal.company).toBeUndefined()
    expect(minimal.mrr).toBeUndefined()
    expect(minimal.internalNote).toBeUndefined()
  })
})
