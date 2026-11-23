import { describe, it, expect } from "vitest"
import {
  listFeedbackMcpSchema,
  getFeedbackDetailsMcpSchema,
  createFeedbackMcpSchema,
  updatePostStatusMcpSchema,
  getRoadmapKanbanMcpSchema,
  createChangelogReleaseMcpSchema,
} from "../src/schemas/mcp"

describe("MCP Tool Zod Schemas", () => {
  it("validates list_feedback input with defaults", () => {
    const parsed = listFeedbackMcpSchema.parse({})
    expect(parsed.status).toBe("all")
    expect(parsed.sortBy).toBe("popular")
    expect(parsed.limit).toBe(10)
  })

  it("validates get_feedback_details requires postId", () => {
    expect(() => getFeedbackDetailsMcpSchema.parse({})).toThrow()
    const valid = getFeedbackDetailsMcpSchema.parse({ postId: "post_123" })
    expect(valid.postId).toBe("post_123")
  })

  it("validates create_feedback schema", () => {
    expect(() =>
      createFeedbackMcpSchema.parse({ title: "ab", content: "short" }),
    ).toThrow()

    const valid = createFeedbackMcpSchema.parse({
      title: "Export to CSV feature",
      content: "Please allow exporting reports to CSV format",
      customerEmail: "user@example.com",
      customerMrr: 500,
    })
    expect(valid.title).toBe("Export to CSV feature")
    expect(valid.customerMrr).toBe(500)
  })

  it("validates update_post_status schema and requires valid status", () => {
    expect(() =>
      updatePostStatusMcpSchema.parse({
        postId: "p_1",
        status: "invalid_status",
      }),
    ).toThrow()

    const valid = updatePostStatusMcpSchema.parse({
      postId: "p_1",
      status: "completed",
    })
    expect(valid.status).toBe("completed")
    expect(valid.notifyVoters).toBe(true)

    // Reopen post
    const reopen = updatePostStatusMcpSchema.parse({
      postId: "p_1",
      status: "open",
    })
    expect(reopen.status).toBe("open")
  })

  it("handles empty string email gracefully in create_feedback", () => {
    const valid = createFeedbackMcpSchema.parse({
      title: "Some feature",
      content: "Details here",
      customerEmail: "",
    })
    expect(valid.customerEmail).toBe("")
  })

  it("validates get_roadmap_kanban schema", () => {
    const valid = getRoadmapKanbanMcpSchema.parse({})
    expect(valid).toBeDefined()
  })

  it("validates create_changelog_release schema", () => {
    expect(() =>
      createChangelogReleaseMcpSchema.parse({
        version: "v1.0",
        // missing title & content
      }),
    ).toThrow()

    const valid = createChangelogReleaseMcpSchema.parse({
      version: "v1.2.0",
      title: "Dark Mode & CSV Export",
      content: "We launched dark mode!",
      postIds: ["post_1", "post_2"],
    })
    expect(valid.version).toBe("v1.2.0")
    expect(valid.postIds).toHaveLength(2)
  })
})
