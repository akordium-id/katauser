import { describe, it, expect } from "vitest"
import { parseSSEChunk, type ChatMessage } from "../src/chat-helpers"

describe("Widget Chat Helpers (Feedback Bridge)", () => {
  it("parses text and action payload from SSE chunk", () => {
    const chunkWithAction = JSON.stringify({
      action: {
        type: "similar_post",
        post: {
          id: "p_123",
          title: "Dark Mode",
          content: "Dark mode please",
          votesCount: 10,
          status: "planned",
          boardSlug: "fitur",
        },
        similarityScore: 0.88,
      },
    })

    const parsed = parseSSEChunk(chunkWithAction)
    expect(parsed).toBeDefined()
    expect((parsed as any).action).toBeDefined()
    expect((parsed as any).action.type).toBe("similar_post")
    expect((parsed as any).action.post.title).toBe("Dark Mode")
  })

  it("handles ChatMessage structure with action and actionResolved", () => {
    const msg: ChatMessage = {
      id: "msg_1",
      sender: "juno",
      text: "Kami menemukan ide serupa di roadmap!",
      time: "10:00",
      action: {
        type: "similar_post",
        post: {
          id: "p_1",
          title: "Ekspor PDF",
          content: "Ekspor ke PDF",
          votesCount: 5,
          status: "planned",
          boardSlug: "fitur",
        },
        similarityScore: 0.75,
      },
      actionResolved: false,
    }

    expect(msg.action?.type).toBe("similar_post")
    expect(msg.actionResolved).toBe(false)
  })

  it("parses create_feedback action payload with data: prefix", () => {
    const sseLine =
      "data: " +
      JSON.stringify({
        action: {
          type: "create_feedback",
          boardId: "b_123",
          boardSlug: "fitur",
          draft: {
            title: "Integrasi Webhook",
            content: "Mohon sediakan webhook untuk event pembayaran",
          },
        },
      })

    const parsed = parseSSEChunk(sseLine)
    expect(parsed).toBeDefined()
    expect((parsed as any).action.type).toBe("create_feedback")
    expect((parsed as any).action.boardSlug).toBe("fitur")
    expect((parsed as any).action.draft.title).toBe("Integrasi Webhook")
  })

  it("maintains backward compatibility with text chunks", () => {
    const rawLine = 'data: {"text":"Halo! Saya Juno."}'
    expect(parseSSEChunk(rawLine)).toBe("Halo! Saya Juno.")

    const textWithoutPrefix = '{"text":"Pesan teks langsung"}'
    expect(parseSSEChunk(textWithoutPrefix)).toBe("Pesan teks langsung")
  })

  it("returns null for [DONE] terminator or invalid payload", () => {
    expect(parseSSEChunk("data: [DONE]")).toBeNull()
    expect(parseSSEChunk("[DONE]")).toBeNull()
    expect(parseSSEChunk("")).toBeNull()
    expect(parseSSEChunk("data: not-json")).toBeNull()
  })
})
