import { describe, it, expect } from "vitest"
import {
  getColumnMeta,
  countTotalRoadmapItems,
} from "../src/lib/roadmap-helpers"

describe("Roadmap UI Helpers", () => {
  it("returns column titles and visual theme styles", () => {
    const plannedMeta = getColumnMeta("planned")
    expect(plannedMeta.title).toBe("Planned")
    expect(plannedMeta.color).toContain("blue")

    const inProgressMeta = getColumnMeta("inProgress")
    expect(inProgressMeta.title).toBe("In Progress")
    expect(inProgressMeta.color).toContain("amber")

    const completedMeta = getColumnMeta("completed")
    expect(completedMeta.title).toBe("Completed")
    expect(completedMeta.color).toContain("emerald")
  })

  it("calculates total items across all 3 roadmap columns", () => {
    const roadmap = {
      planned: [{ id: "1" }, { id: "2" }],
      inProgress: [{ id: "3" }],
      completed: [{ id: "4" }, { id: "5" }, { id: "6" }],
    }
    expect(countTotalRoadmapItems(roadmap as any)).toBe(6)
  })
})
