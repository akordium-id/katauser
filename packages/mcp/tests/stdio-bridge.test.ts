import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMcpServerInstance } from "../src/index"

describe("Katauser MCP Server Instance", () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initializes MCP server and registers tools", async () => {
    const { server, tools } = createMcpServerInstance({
      apiUrl: "http://localhost:3000",
      apiKey: "ku_live_test_key_12345",
    })

    expect(server).toBeDefined()
    expect(tools).toHaveLength(6)
    const toolNames = tools.map((t) => t.name)
    expect(toolNames).toContain("list_feedback")
    expect(toolNames).toContain("get_feedback_details")
    expect(toolNames).toContain("create_feedback")
    expect(toolNames).toContain("update_post_status")
    expect(toolNames).toContain("get_roadmap_kanban")
    expect(toolNames).toContain("create_changelog_release")
  })

  it("handles tool call and proxies to backend API", async () => {
    const mockApiResponse = {
      success: true,
      posts: [
        { id: "p_1", title: "Dark mode", votesCount: 10, totalMrr: 500 },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    }) as any

    try {
      const { executeTool } = createMcpServerInstance({
        apiUrl: "http://localhost:3000/",
        apiKey: "ku_live_test_key_12345",
      })

      const response = await executeTool("list_feedback", {
        status: "open",
        limit: 5,
      })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/mcp/tools/list_feedback",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer ku_live_test_key_12345",
            "Content-Type": "application/json",
          }),
        }),
      )

      expect(response.isError).toBeFalsy()
      expect(response.content[0].text).toContain("Dark mode")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("handles backend error or network offline gracefully", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("Connection refused")) as any

    try {
      const { executeTool } = createMcpServerInstance({
        apiUrl: "http://localhost:3000",
        apiKey: "ku_live_test_key_12345",
      })

      const response = await executeTool("list_feedback", {})

      expect(response.isError).toBe(true)
      expect(response.content[0].text).toContain("Connection refused")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("formats Zod validation errors from backend into readable text", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: "title: String must contain at least 3 character(s)",
        errors: [{ path: ["title"], message: "String must contain at least 3 character(s)" }],
      }),
    }) as any

    try {
      const { executeTool } = createMcpServerInstance({
        apiUrl: "http://localhost:3000",
        apiKey: "ku_live_test_key_12345",
      })

      const response = await executeTool("create_feedback", { title: "ab" })
      expect(response.isError).toBe(true)
      expect(response.content[0].text).toContain("title: String must contain at least 3 character(s)")
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("handles non-JSON error pages from reverse proxy safely", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("Unexpected token < in JSON at position 0")
      },
      text: async () => "<html><body>502 Bad Gateway</body></html>",
    }) as any

    try {
      const { executeTool } = createMcpServerInstance({
        apiUrl: "http://localhost:3000",
        apiKey: "ku_live_test_key_12345",
      })

      const response = await executeTool("list_feedback", {})
      expect(response.isError).toBe(true)
      expect(response.content[0].text).toContain("502 Bad Gateway")
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
