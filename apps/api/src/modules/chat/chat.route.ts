import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { zValidator } from "@hono/zod-validator"
import {
  createConversationSchema,
  sendMessageSchema,
  escalateConversationSchema,
  type JunoActionPayload,
} from "@katauser/shared"

import { getWorkspaceWebhookConfig } from "../integrations/integrations.route"
import { dispatchWebhookEvent } from "../integrations/webhook-dispatcher"
import { findRelevantKnowledgeContext } from "../ai/knowledge.route"
import { postsStore } from "../feedback/posts.route"
import { boardsStore } from "../feedback/boards.route"
import {
  generateEmbedding,
  cosineSimilarity,
} from "../../services/ai-embeddings"

export interface ConversationItem {
  id: string
  workspaceId: string
  endUserId?: string
  status: "open" | "pending" | "closed"
  assignedTo: "ai_juno" | "human"
  createdAt: string
}

export interface MessageItem {
  id: string
  conversationId: string
  senderType: "end_user" | "agent" | "ai"
  senderId: string
  content: string
  action?: JunoActionPayload
  createdAt: string
}

export const conversationsStore: ConversationItem[] = []
export const messagesStore: MessageItem[] = []

export function isFeedbackIntent(prompt: string): boolean {
  const p = prompt.trim()
  if (!p) return false

  // If user is asking "bagaimana cara" (how to) or "how do I" / "how to", it is a support/knowledge inquiry,
  // NOT a feedback/feature request (unless they explicitly say "buatkan", "tambahkan", "usul", "request").
  if (
    /(?:bagaimana|jelaskan|tanya)\s+cara|how\s+(?:do\s+i|to|can\s+i)/i.test(p) &&
    !/(?:buatkan|tambahkan|usul|ide|request|feature\s*request)/i.test(p)
  ) {
    return false
  }

  const pattern =
    /(?:fitur|tolong buatkan|bisa tambahkan|tolong tambahkan|bisa buatkan|bisa bikin|tolong bikin|usul|ide|saran|request|masukan|fitur baru|feature|integrasi|integration|please add|can you add|could you add|would love to have)/i
  return pattern.test(p)
}

export function extractFeedbackTitle(prompt: string): string {
  let title = prompt
    .replace(
      /^(?:tolong|bisa|mohon)?\s*(?:buatkan|tambahkan|sediakan|adakan|bikin)?\s*(?:fitur|opsi)?\s*/i,
      "",
    )
    .trim()
  if (!title) {
    title = prompt.trim()
  }
  title = title.charAt(0).toUpperCase() + title.slice(1)
  if (title.length > 80) {
    title = title.slice(0, 77) + "..."
  }
  return title
}

export const chatRoute = new Hono()
  // Create or resume conversation
  .post(
    "/chat/conversations",
    zValidator("json", createConversationSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400)
      }
    }),
    async (c) => {
      const data = c.req.valid("json")
      const convId = "conv_" + Math.random().toString(36).substring(2, 10)

      const conversation: ConversationItem = {
        id: convId,
        workspaceId: data.workspaceId,
        endUserId: data.endUserId,
        status: "open",
        assignedTo: "ai_juno",
        createdAt: new Date().toISOString(),
      }

      conversationsStore.push(conversation)

      if (data.initialMessage) {
        const msgId = "msg_" + Math.random().toString(36).substring(2, 10)
        messagesStore.push({
          id: msgId,
          conversationId: convId,
          senderType: "end_user",
          senderId: data.endUserId || "anonymous",
          content: data.initialMessage,
          createdAt: new Date().toISOString(),
        })
      }

      return c.json({ success: true, conversation }, 201)
    },
  )

  // Get messages for a conversation
  .get("/chat/conversations/:id/messages", (c) => {
    const id = c.req.param("id")
    const messages = messagesStore.filter((m) => m.conversationId === id)
    return c.json({ success: true, messages })
  })

  // Send a message
  .post(
    "/chat/conversations/:id/messages",
    zValidator("json", sendMessageSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400)
      }
    }),
    async (c) => {
      const data = c.req.valid("json")
      const msgId = "msg_" + Math.random().toString(36).substring(2, 10)

      const message: MessageItem = {
        id: msgId,
        conversationId: data.conversationId,
        senderType: data.senderType,
        senderId: data.senderId,
        content: data.content,
        createdAt: new Date().toISOString(),
      }

      messagesStore.push(message)

      return c.json({ success: true, message }, 201)
    },
  )

  // Escalate conversation to human support
  .post(
    "/chat/conversations/:id/escalate",
    zValidator("json", escalateConversationSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400)
      }
    }),
    async (c) => {
      const id = c.req.param("id")
      const conv = conversationsStore.find((item) => item.id === id)

      if (!conv) {
        return c.json(
          { success: false, message: "Conversation not found" },
          404,
        )
      }

      conv.assignedTo = "human"

      // Dispatch webhook to Slack/Discord
      const webhookConfig = getWorkspaceWebhookConfig(conv.workspaceId)
      if (webhookConfig) {
        dispatchWebhookEvent(webhookConfig, {
          event: "chat.escalated",
          workspaceSlug: conv.workspaceId,
          timestamp: new Date().toISOString(),
          data: {
            conversationId: conv.id,
            authorName: conv.endUserId || "Pelanggan",
            initialMessage: "Customer meminta bantuan live support manusia",
            url: `https://katauser.com/dashboard/${conv.workspaceId}/inbox`,
          },
        }).catch(() => {})
      }

      // System notification message
      messagesStore.push({
        id: "msg_sys_" + Math.random().toString(36).substring(2, 10),
        conversationId: id,
        senderType: "ai",
        senderId: "system",
        content:
          "Percakapan telah dialihkan ke tim support manusia. Agen kami akan segera bergabung.",
        createdAt: new Date().toISOString(),
      })

      return c.json({ success: true, conversation: conv })
    },
  )

  // AI Juno SSE Streaming response
  .post("/chat/conversations/:id/juno-stream", async (c) => {
    const id = c.req.param("id")
    const body = await c.req.json().catch(() => ({ prompt: "" }))
    const prompt = body.prompt || ""

    // Check for human handoff intent
    const isHumanHandoffRequested =
      /manusia|orang asli|human|staf|agent|admin|bantuan langsung/i.test(prompt)

    const conv = conversationsStore.find((item) => item.id === id)
    if (conv && isHumanHandoffRequested) {
      conv.assignedTo = "human"

      // Dispatch webhook to Slack/Discord
      const webhookConfig = getWorkspaceWebhookConfig(conv.workspaceId)
      if (webhookConfig) {
        dispatchWebhookEvent(webhookConfig, {
          event: "chat.escalated",
          workspaceSlug: conv.workspaceId,
          timestamp: new Date().toISOString(),
          data: {
            conversationId: conv.id,
            authorName: conv.endUserId || "Pelanggan",
            initialMessage: "Customer meminta bantuan live support manusia",
            url: `https://katauser.com/dashboard/${conv.workspaceId}/inbox`,
          },
        }).catch(() => {})
      }
    }

    let aiMessageChunks: string[] = []
    let action: JunoActionPayload | undefined

    if (isHumanHandoffRequested) {
      aiMessageChunks = [
        "Saya memahami Anda ingin berbicara dengan staf kami. ",
        "Saya telah mengalihkan percakapan ini ke tim support manusia kami. ",
        "Mohon menunggu sebentar, tim kami akan segera membalas di sini.",
      ]
    } else if (isFeedbackIntent(prompt)) {
      const workspaceId = conv?.workspaceId || "acme"
      const workspaceBoards = boardsStore.filter(
        (b) => b.workspaceId === workspaceId,
      )
      const boardIds = new Set(workspaceBoards.map((b) => b.id))
      const boardMap = new Map(workspaceBoards.map((b) => [b.id, b]))

      const activePosts = postsStore.filter(
        (p) =>
          boardIds.has(p.boardId) &&
          p.status !== "closed" &&
          p.status !== "merged" &&
          !p.mergedIntoPostId,
      )

      let bestPost: (typeof activePosts)[0] | null = null
      let bestScore = 0

      if (activePosts.length > 0) {
        const queryEmbedding = await generateEmbedding(prompt)

        for (const post of activePosts) {
          if (!post.embedding) {
            post.embedding = await generateEmbedding(
              `${post.title} ${post.content}`,
            )
          }
          const titleEmbedding = await generateEmbedding(post.title)
          const scoreWithFull = cosineSimilarity(queryEmbedding, post.embedding)
          const scoreWithTitle = cosineSimilarity(queryEmbedding, titleEmbedding)
          let score = Math.max(scoreWithFull, scoreWithTitle)

          const stopWords = new Set([
            "bisa",
            "tolong",
            "buatkan",
            "tambahkan",
            "fitur",
            "untuk",
            "yang",
            "dan",
            "dari",
            "saya",
            "ada",
            "ke",
            "di",
            "ini",
            "itu",
          ])
          const queryTokens: string[] = prompt
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w: string) => w.length > 2 && !stopWords.has(w))

          const targetTokens: string[] = `${post.title} ${post.content}`
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w: string) => w.length > 2)

          const common = queryTokens.filter((t: string) =>
            targetTokens.includes(t),
          )
          if (common.length >= 2) {
            score = Math.max(
              score,
              Math.min(
                0.95,
                0.75 + (common.length / Math.max(queryTokens.length, 1)) * 0.2,
              ),
            )
          }

          if (score > bestScore) {
            bestScore = score
            bestPost = post
          }
        }
      }

      if (bestPost && bestScore >= 0.7) {
        const board = boardMap.get(bestPost.boardId)
        const boardSlug = board?.slug || "fitur"
        const validStatuses = [
          "open",
          "under_review",
          "planned",
          "in_progress",
          "completed",
          "closed",
        ] as const
        type ValidStatus = (typeof validStatuses)[number]

        const postStatus: ValidStatus = (
          validStatuses.includes(bestPost.status as ValidStatus)
            ? bestPost.status
            : "open"
        ) as ValidStatus

        action = {
          type: "similar_post",
          post: {
            id: bestPost.id,
            title: bestPost.title,
            content: bestPost.content,
            votesCount: bestPost.votesCount ?? 0,
            status: postStatus,
            boardSlug,
          },
          similarityScore: Number(bestScore.toFixed(2)),
        }

        aiMessageChunks = [
          "Halo! Terima kasih atas masukannya. ",
          `Kami menemukan ide serupa yang sudah tercatat di roadmap kami: "${bestPost.title}". `,
          "Apakah Anda ingin menambahkan upvote untuk mendukung ide ini?",
        ]
      } else {
        const targetBoard =
          workspaceBoards.find((b) => b.slug === "fitur" && !b.isPrivate) ||
          workspaceBoards.find((b) => !b.isPrivate) ||
          workspaceBoards[0]

        const boardId = targetBoard?.id || "board_feat_1"
        const boardSlug = targetBoard?.slug || "fitur"
        const draftTitle = extractFeedbackTitle(prompt)

        action = {
          type: "create_feedback",
          boardId,
          boardSlug,
          draft: {
            title: draftTitle,
            content: prompt,
          },
        }

        aiMessageChunks = [
          "Ide atau masukan yang sangat bagus! ",
          "Kami belum menemukan ide serupa di roadmap kami. ",
          "Apakah Anda ingin mendaftarkan ide ini langsung ke feedback board?",
        ]
      }
    } else {
      const workspaceId = conv?.workspaceId || "acme"
      const knowledgeContext = prompt
        ? await findRelevantKnowledgeContext(workspaceId, prompt, 2)
        : []

      if (knowledgeContext.length > 0) {
        aiMessageChunks = [
          "Halo! Saya Juno dari Katauser. ",
          "Berdasarkan basis pengetahuan kami: ",
          `"${knowledgeContext[0]}" `,
          "Semoga informasi ini membantu! Ada yang bisa saya bantu lagi?",
        ]
      } else {
        aiMessageChunks = [
          "Halo! Saya Juno dari Katauser. ",
          "Terkait pertanyaan Anda mengenai ",
          prompt ? `"${prompt}": ` : "fitur ini: ",
          "Anda dapat mengonfigurasi dan mencobanya langsung melalui tab Roadmap atau portal saran. ",
          "Apakah ada hal lain yang bisa saya bantu?",
        ]
      }
    }

    const fullResponse = aiMessageChunks.join("")

    return streamSSE(c, async (stream) => {
      for (const chunk of aiMessageChunks) {
        await stream.writeSSE({ data: JSON.stringify({ text: chunk }) })
        await stream.sleep(20)
      }
      if (action) {
        await stream.writeSSE({ data: JSON.stringify({ action }) })
        await stream.sleep(20)
      }
      await stream.writeSSE({ data: "[DONE]" })

      // Persist AI message to store
      messagesStore.push({
        id: "msg_ai_" + Math.random().toString(36).substring(2, 10),
        conversationId: id,
        senderType: "ai",
        senderId: "ai_juno",
        content: fullResponse,
        ...(action ? { action } : {}),
        createdAt: new Date().toISOString(),
      })
    })
  })

  // List conversations for admin inbox
  .get("/workspaces/:slug/conversations", (c) => {
    const slug = c.req.param("slug")
    const conversations = conversationsStore.filter(
      (item) => item.workspaceId === slug || item.workspaceId === "acme-corp",
    )
    return c.json({ success: true, conversations })
  })
