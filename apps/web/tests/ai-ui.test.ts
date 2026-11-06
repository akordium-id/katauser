import { describe, it, expect } from "vitest"
import { formatSimilarityPercent, truncateSnippet } from "../src/lib/ai-helpers"

describe("AI & Knowledge Base UI Helpers", () => {
  it("formats similarity scores into readable percentages", () => {
    expect(formatSimilarityPercent(0.854)).toBe("85% Kemiripan")
    expect(formatSimilarityPercent(0.5)).toBe("50% Kemiripan")
    expect(formatSimilarityPercent(1)).toBe("100% Kemiripan")
    expect(formatSimilarityPercent(0)).toBe("0% Kemiripan")
  })

  it("truncates long snippet previews properly with ellipsis", () => {
    const text =
      "Sistem penagihan Katauser mendukung kartu kredit, transfer bank, dan QRIS. Semua faktur bulanan dapat diunduh."
    expect(truncateSnippet(text, 30)).toBe("Sistem penagihan Katauser mend...")
    expect(truncateSnippet("Short text", 50)).toBe("Short text")
    expect(truncateSnippet("", 20)).toBe("")
  })
})
