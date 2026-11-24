import { describe, it, expect, beforeEach } from "vitest"
import {
  chatRoute,
  conversationsStore,
  messagesStore,
} from "../src/modules/chat/chat.route"
import { postsStore } from "../src/modules/feedback/posts.route"
import { boardsStore } from "../src/modules/feedback/boards.route"

describe("Chat to Feedback Bridge (Hono API)", () => {
  beforeEach(() => {
    conversationsStore.length = 0
    messagesStore.length = 0
    postsStore.length = 0
    boardsStore.length = 0

    // Setup mock boards
    boardsStore.push({
      id: "board_feat_1",
      workspaceId: "acme",
      name: "Ide & Fitur",
      slug: "fitur",
      description: null,
      isPrivate: false,
      allowGuestPosts: true,
      createdAt: new Date().toISOString(),
    })

    // Setup conversation
    conversationsStore.push({
      id: "conv_test_1",
      workspaceId: "acme",
      status: "open",
      assignedTo: "ai_juno",
      createdAt: new Date().toISOString(),
    })
  })

  it("suggests similar_post action card when prompt closely matches an existing active post", async () => {
    // Add existing post
    postsStore.push({
      id: "p_dark_mode",
      boardId: "board_feat_1",
      title: "Mode Gelap (Dark Mode)",
      content: "Tolong sediakan tema gelap untuk menghemat baterai",
      status: "in_progress",
      votesCount: 24,
      totalMrr: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const res = await chatRoute.request(
      "/chat/conversations/conv_test_1/juno-stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Bisa tambahkan fitur dark mode malam hari?",
        }),
      },
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('"type":"similar_post"')
    expect(text).toContain("Mode Gelap (Dark Mode)")
    expect(text).toContain("p_dark_mode")
  })

  it("suggests create_feedback action card when prompt has feedback intent but no similar post exists", async () => {
    const res = await chatRoute.request(
      "/chat/conversations/conv_test_1/juno-stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Tolong buatkan fitur ekspor data ke format Apache Parquet",
        }),
      },
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('"type":"create_feedback"')
    expect(text).toContain("board_feat_1")
    expect(text).toContain("Apache Parquet")
  })

  it("does not attach action card for normal question without feedback intent", async () => {
    const res = await chatRoute.request(
      "/chat/conversations/conv_test_1/juno-stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Bagaimana cara mengganti kata sandi saya?",
        }),
      },
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).not.toContain('"action"')
  })

  it("ignores closed or merged posts when finding similar posts", async () => {
    postsStore.push({
      id: "p_closed_1",
      boardId: "board_feat_1",
      title: "Integrasi Slack Webhook",
      content: "Notifikasi slack",
      status: "closed",
      votesCount: 5,
      totalMrr: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const res = await chatRoute.request(
      "/chat/conversations/conv_test_1/juno-stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Bisa buatkan integrasi notifikasi ke Slack?",
        }),
      },
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    // Should NOT match closed post, should offer create_feedback instead
    expect(text).not.toContain("p_closed_1")
    expect(text).toContain('"type":"create_feedback"')
  })

  it("ignores posts from private boards to prevent internal data leaks", async () => {
    // Setup private board
    boardsStore.push({
      id: "board_private_1",
      workspaceId: "acme",
      name: "Internal Secret Board",
      slug: "secret",
      description: null,
      isPrivate: true,
      allowGuestPosts: false,
      createdAt: new Date().toISOString(),
    })

    // Post on private board
    postsStore.push({
      id: "p_secret_feature",
      boardId: "board_private_1",
      title: "Project Titan AI Bot",
      content: "Fitur rahasia internal tim",
      status: "in_progress",
      votesCount: 50,
      totalMrr: 10000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const res = await chatRoute.request(
      "/chat/conversations/conv_test_1/juno-stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Bisa buatkan fitur Project Titan AI Bot?",
        }),
      },
    )

    expect(res.status).toBe(200)
    const text = await res.text()
    // Must NOT reveal private post ID or title in similar_post
    expect(text).not.toContain("p_secret_feature")
    expect(text).not.toContain('"type":"similar_post"')
    // Should fall back to create_feedback on public board
    expect(text).toContain('"type":"create_feedback"')
  })
})
