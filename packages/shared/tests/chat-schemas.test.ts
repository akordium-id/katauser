import { describe, it, expect } from "vitest"
import {
  createConversationSchema,
  sendMessageSchema,
  escalateConversationSchema,
  junoActionPayloadSchema,
  type JunoSimilarPostAction,
  type JunoCreateFeedbackAction,
  type JunoStreamChunk,
} from "../src"

describe("Chat & Conversation Zod Schemas", () => {
  it("validates conversation creation payload", () => {
    const valid = {
      workspaceId: "acme-corp",
      endUserId: "usr_123",
      initialMessage: "Halo, saya punya pertanyaan soal billing",
    }
    const parsed = createConversationSchema.parse(valid)
    expect(parsed.workspaceId).toBe("acme-corp")
    expect(parsed.endUserId).toBe("usr_123")
    expect(parsed.initialMessage).toBe(
      "Halo, saya punya pertanyaan soal billing",
    )
  })

  it("validates message sending payload and rejects empty content", () => {
    const validMessage = {
      conversationId: "conv_456",
      senderType: "end_user",
      senderId: "usr_123",
      content: "Bagaimana cara setup custom domain?",
    }
    const parsed = sendMessageSchema.parse(validMessage)
    expect(parsed.senderType).toBe("end_user")
    expect(parsed.content).toBe("Bagaimana cara setup custom domain?")

    // Reject empty content
    expect(() =>
      sendMessageSchema.parse({
        conversationId: "conv_456",
        senderType: "end_user",
        senderId: "usr_123",
        content: "   ",
      }),
    ).toThrow()
  })

  it("validates conversation escalation payload", () => {
    const validEscalation = {
      conversationId: "conv_456",
      reason: "User meminta berbicara dengan staf manusia",
    }
    const parsed = escalateConversationSchema.parse(validEscalation)
    expect(parsed.conversationId).toBe("conv_456")
    expect(parsed.reason).toContain("staf manusia")
  })
})

describe("Juno Action Schemas", () => {
  it("validates a similar_post action payload", () => {
    const validSimilar: JunoSimilarPostAction = {
      type: "similar_post",
      post: {
        id: "post_123",
        title: "Ekspor Laporan ke CSV",
        content: "Tambahkan opsi ekspor CSV",
        votesCount: 15,
        status: "planned",
        boardSlug: "fitur",
      },
      similarityScore: 0.85,
    }

    const parsed = junoActionPayloadSchema.safeParse(validSimilar)
    expect(parsed.success).toBe(true)
  })

  it("validates a create_feedback action payload", () => {
    const validCreate: JunoCreateFeedbackAction = {
      type: "create_feedback",
      boardId: "board_abc",
      boardSlug: "fitur",
      draft: {
        title: "Integrasi WhatsApp Notifikasi",
        content: "Kirim notifikasi ke nomor WA user",
      },
    }

    const parsed = junoActionPayloadSchema.safeParse(validCreate)
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid action payload type", () => {
    const invalid = {
      type: "unknown_action",
    }
    const parsed = junoActionPayloadSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })
})
