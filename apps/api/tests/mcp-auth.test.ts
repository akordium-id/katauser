import { describe, it, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { mcpRoute, registerApiKeyForWorkspace, clearApiKeysStore } from "../src/modules/mcp/mcp.route"

describe("MCP API Key Authentication", () => {
  let app: Hono

  beforeEach(() => {
    clearApiKeysStore()
    app = new Hono().route("/api/v1/mcp", mcpRoute)
  })

  it("returns 401 Unauthorized when Authorization header is missing", async () => {
    const res = await app.request("/api/v1/mcp/tools")
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain("Unauthorized")
  })

  it("returns 401 Unauthorized for malformed Bearer token", async () => {
    const res = await app.request("/api/v1/mcp/tools", {
      headers: { Authorization: "Bearer invalid_key" },
    })
    expect(res.status).toBe(401)
  })

  it("returns 200 and lists tools when valid Bearer token is provided", async () => {
    registerApiKeyForWorkspace("ku_live_valid1234567890abcdef1234567890abcdef", "acme")

    const res = await app.request("/api/v1/mcp/tools", {
      headers: {
        Authorization: "Bearer ku_live_valid1234567890abcdef1234567890abcdef",
      },
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tools).toBeDefined()
    expect(Array.isArray(data.tools)).toBe(true)
    const toolNames = data.tools.map((t: any) => t.name)
    expect(toolNames).toContain("list_feedback")
    expect(toolNames).toContain("create_feedback")
    expect(toolNames).toContain("update_post_status")
  })
})
