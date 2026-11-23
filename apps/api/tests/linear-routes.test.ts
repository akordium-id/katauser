import { describe, it, expect, vi, beforeEach } from "vitest"
import { Hono } from "hono"
import { linearRoute } from "../src/modules/integrations/linear.route"

describe("Linear Hono API Routes", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono().route("/", linearRoute)
  })

  it("POST /workspaces/:slug/integrations/linear/test validates payload and tests connection", async () => {
    const res = await app.request("/workspaces/acme/integrations/linear/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: "lin_api_valid_token" }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.organizationName).toBeDefined()
  })

  it("POST /workspaces/:slug/integrations/linear saves integration settings", async () => {
    const res = await app.request("/workspaces/acme/integrations/linear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: "lin_api_valid_token",
        webhookSecret: "whsec_valid_secret",
        defaultTeamId: "team_eng",
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.integration).toBeDefined()
  })

  it("GET /workspaces/:slug/integrations/linear retrieves connection status", async () => {
    const res = await app.request("/workspaces/acme/integrations/linear", {
      method: "GET",
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.webhookUrl).toContain("/api/v1/integrations/linear/webhook/acme")
  })

  it("POST /integrations/linear/webhook/:workspaceSlug handles inbound webhook with signature verification", async () => {
    const res = await app.request("/integrations/linear/webhook/acme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Linear-Signature": "invalid_signature",
      },
      body: JSON.stringify({ action: "update", type: "Issue" }),
    })

    expect(res.status).toBe(401)
  })

  it("POST /workspaces/:slug/posts/:postId/issues/linear creates and links issue", async () => {
    const res = await app.request("/workspaces/acme/posts/post_1/issues/linear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: "post_1",
        teamId: "team_eng",
        title: "Dark mode support",
        priority: 1,
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.issue).toBeDefined()
  })

  it("POST /workspaces/:slug/posts/:postId/issues/linear/link links existing issue", async () => {
    const res = await app.request(
      "/workspaces/acme/posts/post_1/issues/linear/link",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: "post_1",
          issueIdOrKey: "ENG-142",
        }),
      },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.issue).toBeDefined()
  })
})
