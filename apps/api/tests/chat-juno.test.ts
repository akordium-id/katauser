import { describe, it, expect } from "vitest"
import { app } from "../src/app"

describe("Live Chat & Juno AI Hono API Routes", () => {
  let createdConvId = ""

  it("POST /api/v1/chat/conversations creates a new chat session", async () => {
    const res = await app.request("/api/v1/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "acme-corp",
        endUserId: "usr_client_1",
        initialMessage: "Halo Juno, bagaimana cara mengintegrasikan widget?",
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.conversation.id).toBeDefined()
    expect(data.conversation.assignedTo).toBe("ai_juno")
    createdConvId = data.conversation.id
  })

  it("POST /api/v1/chat/conversations/:id/messages posts a user message", async () => {
    const res = await app.request(
      `/api/v1/chat/conversations/${createdConvId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: createdConvId,
          senderType: "end_user",
          senderId: "usr_client_1",
          content: "Apakah ada panduan API untuk Hono RPC?",
        }),
      },
    )

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.message.content).toContain("Hono RPC")
  })

  it("GET /api/v1/chat/conversations/:id/messages fetches conversation thread", async () => {
    const res = await app.request(
      `/api/v1/chat/conversations/${createdConvId}/messages`,
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.messages)).toBe(true)
    expect(data.messages.length).toBeGreaterThan(0)
  })

  it("POST /api/v1/chat/conversations/:id/escalate escalates chat to human support", async () => {
    const res = await app.request(
      `/api/v1/chat/conversations/${createdConvId}/escalate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: createdConvId,
          reason: "User meminta konfirmasi staf manusia",
        }),
      },
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.conversation.assignedTo).toBe("human")
  })

  it("POST /api/v1/chat/conversations/:id/juno-stream streams AI response via SSE", async () => {
    const res = await app.request(
      `/api/v1/chat/conversations/${createdConvId}/juno-stream`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Jelaskan cara setting custom domain",
        }),
      },
    )

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/event-stream")
    const text = await res.text()
    expect(text.length).toBeGreaterThan(0)
  })
})
