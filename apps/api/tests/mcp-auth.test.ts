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

  it("enforces write permissions: read-only key cannot execute write tools", async () => {
    const readOnlyKey = "ku_live_readonly_1234567890abcdef1234567890"
    registerApiKeyForWorkspace(readOnlyKey, "acme", ["read"])

    // Read tool -> Allowed
    const resRead = await app.request("/api/v1/mcp/tools/list_feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${readOnlyKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })
    expect(resRead.status).toBe(200)

    // Write tool -> Forbidden (403)
    const resWrite = await app.request("/api/v1/mcp/tools/create_feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${readOnlyKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Forbidden Post",
        content: "Should not be created",
      }),
    })
    expect(resWrite.status).toBe(403)
    const dataWrite = await resWrite.json()
    expect(dataWrite.success).toBe(false)
    expect(dataWrite.message).toContain("Forbidden")
  })

  it("rejects expired API key with 401 Unauthorized", async () => {
    const expiredKey = "ku_live_expired_1234567890abcdef1234567890"
    const record = registerApiKeyForWorkspace(expiredKey, "acme")
    record.expiresAt = new Date(Date.now() - 1000 * 60).toISOString() // expired 1m ago

    const res = await app.request("/api/v1/mcp/tools", {
      headers: { Authorization: `Bearer ${expiredKey}` },
    })
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.message).toContain("expired")
  })
})
