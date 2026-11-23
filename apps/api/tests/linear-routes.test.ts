import { describe, it, expect, vi, beforeEach } from "vitest"
import { Hono } from "hono"
import { createHmac } from "node:crypto"
import {
  linearRoute,
  setLinearIntegrationForWorkspace,
  postIssuesStore,
} from "../src/modules/integrations/linear.route"

describe("Linear Hono API Routes", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono().route("/", linearRoute)
    setLinearIntegrationForWorkspace("acme", {
      apiKey: "lin_api_valid_token",
      webhookSecret: "whsec_valid_secret",
      defaultTeamId: "team_eng",
      organizationName: "Acme Corp",
      isActive: true,
    })
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

  it("POST /integrations/linear/webhook/:workspaceSlug rejects unconfigured workspace with 401", async () => {
    const res = await app.request(
      "/integrations/linear/webhook/unconfigured_workspace",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Linear-Signature": "some_sig",
        },
        body: JSON.stringify({ action: "update", type: "Issue" }),
      },
    )

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toContain("belum dikonfigurasi")
  })

  it("POST /integrations/linear/webhook/:workspaceSlug rejects invalid signature with 401", async () => {
    const res = await app.request("/integrations/linear/webhook/acme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Linear-Signature": "tampered_signature",
      },
      body: JSON.stringify({ action: "update", type: "Issue" }),
    })

    expect(res.status).toBe(401)
  })

  it("POST /workspaces/:slug/posts/:postId/issues/linear creates and links issue", async () => {
    const res = await app.request(
      "/workspaces/acme/posts/post_1/issues/linear",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: "post_1",
          teamId: "team_eng",
          title: "Dark mode support",
          priority: 1,
        }),
      },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.issue).toBeDefined()
  })

  it("POST /workspaces/:slug/posts/:postId/issues/linear/link links existing issue and validates regex", async () => {
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

    // Test invalid format rejected with 400
    const invalidRes = await app.request(
      "/workspaces/acme/posts/post_1/issues/linear/link",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: "post_1",
          issueIdOrKey: "invalid format with spaces",
        }),
      },
    )
    expect(invalidRes.status).toBe(400)
  })

  it("DELETE /workspaces/:slug/posts/:postId/issues/:issueId validates ownership", async () => {
    postIssuesStore.push({
      id: "piss_test_99",
      postId: "post_1",
      workspaceSlug: "acme",
      provider: "linear",
      externalIssueId: "lin_uuid_99",
      issueIdentifier: "ENG-99",
      issueUrl: "https://linear.app/issue/ENG-99",
      issueTitle: "Test",
      issueStatus: "Todo",
      createdAt: new Date().toISOString(),
    })

    // Wrong workspace slug should return 404
    const resWrongWs = await app.request(
      "/workspaces/other_ws/posts/post_1/issues/piss_test_99",
      {
        method: "DELETE",
      },
    )
    expect(resWrongWs.status).toBe(404)

    // Correct should succeed
    const resCorrect = await app.request(
      "/workspaces/acme/posts/post_1/issues/piss_test_99",
      {
        method: "DELETE",
      },
    )
    expect(resCorrect.status).toBe(200)
  })
})
