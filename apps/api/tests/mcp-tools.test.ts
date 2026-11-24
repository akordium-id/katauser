import { describe, it, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import {
  mcpRoute,
  registerApiKeyForWorkspace,
  clearApiKeysStore,
} from "../src/modules/mcp/mcp.route"
import { boardsStore } from "../src/modules/feedback/boards.route"
import { postsStore, votesStore } from "../src/modules/feedback/posts.route"
import { changelogsStore } from "../src/modules/changelog/changelog.route"

describe("MCP Tools Execution API", () => {
  let app: Hono
  const acmeKey = "ku_live_acme_secret_key_1234567890abcdef1234567890"
  const betaKey = "ku_live_beta_secret_key_1234567890abcdef1234567890"

  beforeEach(() => {
    clearApiKeysStore()
    boardsStore.length = 0
    postsStore.length = 0
    votesStore.length = 0
    changelogsStore.length = 0

    registerApiKeyForWorkspace(acmeKey, "acme")
    registerApiKeyForWorkspace(betaKey, "beta")

    // Seed board for acme
    boardsStore.push({
      id: "board_acme_1",
      workspaceId: "acme",
      name: "Feature Requests",
      slug: "feature-requests",
      description: null,
      isPrivate: false,
      allowGuestPosts: true,
      createdAt: new Date().toISOString(),
    })

    // Seed board for beta
    boardsStore.push({
      id: "board_beta_1",
      workspaceId: "beta",
      name: "Beta Ideas",
      slug: "beta-ideas",
      description: null,
      isPrivate: false,
      allowGuestPosts: true,
      createdAt: new Date().toISOString(),
    })

    app = new Hono().route("/api/v1/mcp", mcpRoute)
  })

  it("create_feedback creates a post in the workspace board", async () => {
    const res = await app.request("/api/v1/mcp/tools/create_feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${acmeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Export to CSV button",
        content: "Users want to export analytics data to CSV",
        customerEmail: "vip@customer.com",
        customerMrr: 1200,
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.post.id).toBeDefined()
    expect(data.post.title).toBe("Export to CSV button")
    expect(data.post.totalMrr).toBe(1200)
    expect(data.post.votesCount).toBe(1)
  })

  it("list_feedback filters posts and enforces workspace isolation", async () => {
    // 1. Post in acme
    postsStore.push({
      id: "p_acme_1",
      boardId: "board_acme_1",
      title: "Acme Dark Mode",
      content: "Add dark mode",
      status: "planned",
      votesCount: 10,
      totalMrr: 3000,
      commentsCount: 2,
      createdAt: new Date().toISOString(),
    })

    // 2. Post in beta
    postsStore.push({
      id: "p_beta_1",
      boardId: "board_beta_1",
      title: "Beta Secret Feature",
      content: "Do not show to acme",
      status: "in_progress",
      votesCount: 5,
      totalMrr: 500,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    })

    // Query with acme key
    const resAcme = await app.request("/api/v1/mcp/tools/list_feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${acmeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "all", sortBy: "mrr" }),
    })

    expect(resAcme.status).toBe(200)
    const dataAcme = await resAcme.json()
    expect(dataAcme.success).toBe(true)
    expect(dataAcme.posts).toHaveLength(1)
    expect(dataAcme.posts[0].id).toBe("p_acme_1")

    // Query with beta key
    const resBeta = await app.request("/api/v1/mcp/tools/list_feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${betaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "all" }),
    })
    expect(resBeta.status).toBe(200)
    const dataBeta = await resBeta.json()
    expect(dataBeta.posts).toHaveLength(1)
    expect(dataBeta.posts[0].id).toBe("p_beta_1")
  })

  it("update_post_status updates post status and prevents cross-workspace edits", async () => {
    postsStore.push({
      id: "p_acme_2",
      boardId: "board_acme_1",
      title: "Webhooks Integration",
      content: "Slack webhooks",
      status: "in_progress",
      votesCount: 4,
      totalMrr: 800,
      commentsCount: 1,
      createdAt: new Date().toISOString(),
    })

    // Beta tries to update Acme's post -> should be 404/not found
    const resForbidden = await app.request(
      "/api/v1/mcp/tools/update_post_status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${betaKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: "p_acme_2",
          status: "completed",
        }),
      },
    )
    expect(resForbidden.status).toBe(404)

    // Acme updates its own post -> success
    const resSuccess = await app.request(
      "/api/v1/mcp/tools/update_post_status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${acmeKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: "p_acme_2",
          status: "completed",
        }),
      },
    )
    expect(resSuccess.status).toBe(200)
    const dataSuccess = await resSuccess.json()
    expect(dataSuccess.success).toBe(true)
    expect(dataSuccess.post.status).toBe("completed")
  })

  it("get_roadmap_kanban groups workspace posts by roadmap status", async () => {
    postsStore.push(
      {
        id: "p_1",
        boardId: "board_acme_1",
        title: "Planned item",
        content: "...",
        status: "planned",
        votesCount: 2,
        totalMrr: 100,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "p_2",
        boardId: "board_acme_1",
        title: "In progress item",
        content: "...",
        status: "in_progress",
        votesCount: 5,
        totalMrr: 200,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "p_3",
        boardId: "board_acme_1",
        title: "Completed item",
        content: "...",
        status: "completed",
        votesCount: 10,
        totalMrr: 500,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      },
    )

    const res = await app.request("/api/v1/mcp/tools/get_roadmap_kanban", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${acmeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.roadmap.planned).toHaveLength(1)
    expect(data.roadmap.inProgress).toHaveLength(1)
    expect(data.roadmap.completed).toHaveLength(1)
  })

  it("create_changelog_release publishes a new changelog release", async () => {
    postsStore.push(
      {
        id: "p_1",
        boardId: "board_acme_1",
        title: "Planned item",
        content: "...",
        status: "completed",
        votesCount: 2,
        totalMrr: 100,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "p_2",
        boardId: "board_acme_1",
        title: "In progress item",
        content: "...",
        status: "completed",
        votesCount: 5,
        totalMrr: 200,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      },
    )

    const res = await app.request(
      "/api/v1/mcp/tools/create_changelog_release",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${acmeKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "v1.5.0",
          title: "Native MCP Integration",
          content: "We now support Cursor & Claude Code via native MCP!",
          postIds: ["p_1", "p_2"],
        }),
      },
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.changelog.version).toBe("v1.5.0")
    expect(changelogsStore).toHaveLength(1)
  })

  it("get_feedback_details returns details or 404 if not found / cross-workspace", async () => {
    postsStore.push({
      id: "p_detail_1",
      boardId: "board_acme_1",
      title: "Detailed Post",
      content: "Detailed content",
      status: "open",
      votesCount: 3,
      totalMrr: 600,
      commentsCount: 1,
      createdAt: new Date().toISOString(),
    })

    // Found for Acme
    const resFound = await app.request(
      "/api/v1/mcp/tools/get_feedback_details",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${acmeKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId: "p_detail_1" }),
      },
    )
    expect(resFound.status).toBe(200)
    const dataFound = await resFound.json()
    expect(dataFound.success).toBe(true)
    expect(dataFound.post.id).toBe("p_detail_1")
    expect(dataFound.post.totalMrr).toBe(600)

    // Not found / isolated for Beta
    const resNotFound = await app.request(
      "/api/v1/mcp/tools/get_feedback_details",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${betaKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId: "p_detail_1" }),
      },
    )
    expect(resNotFound.status).toBe(404)
  })

  it("create_feedback rejects non-existent boardSlug with 400", async () => {
    const res = await app.request("/api/v1/mcp/tools/create_feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${acmeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test post",
        content: "Test content",
        boardSlug: "non-existent-board-slug",
      }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain("not found in workspace")
  })

  it("create_changelog_release rejects cross-workspace postIds with 400", async () => {
    postsStore.push({
      id: "p_beta_secret",
      boardId: "board_beta_1", // belongs to beta!
      title: "Beta feature",
      content: "...",
      status: "completed",
      votesCount: 1,
      totalMrr: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    })

    const res = await app.request(
      "/api/v1/mcp/tools/create_changelog_release",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${acmeKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "v1.9.0",
          title: "Hacked Release",
          content: "Trying to link beta post",
          postIds: ["p_beta_secret"],
        }),
      },
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain("Invalid postIds")
  })

  it("formats Zod validation errors with clear message on invalid input", async () => {
    const res = await app.request("/api/v1/mcp/tools/create_feedback", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${acmeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "ab", // too short (min 3)
        content: "",
      }),
    })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain("title")
  })
})
