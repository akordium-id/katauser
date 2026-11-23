import { z } from "zod"

export const senderTypeEnum = z.enum(["end_user", "agent", "ai"])
export type SenderType = z.infer<typeof senderTypeEnum>

export const conversationStatusEnum = z.enum(["open", "pending", "closed"])
export type ConversationStatus = z.infer<typeof conversationStatusEnum>

export const assignedToEnum = z.enum(["ai_juno", "human"])
export type AssignedTo = z.infer<typeof assignedToEnum>

export const createConversationSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID wajib diisi"),
  endUserId: z.string().optional(),
  initialMessage: z.string().optional(),
})

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID wajib diisi"),
  senderType: senderTypeEnum,
  senderId: z.string().min(1, "Sender ID wajib diisi"),
  content: z.string().trim().min(1, "Konten pesan tidak boleh kosong"),
})

export const escalateConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID wajib diisi"),
  reason: z.string().optional(),
})

export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type EscalateConversationInput = z.infer<
  typeof escalateConversationSchema
>

// Juno action card schemas & types
export const junoSimilarPostActionSchema = z.object({
  type: z.literal("similar_post"),
  post: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    content: z.string(),
    votesCount: z.number().int().nonnegative(),
    status: z.enum([
      "open",
      "under_review",
      "planned",
      "in_progress",
      "completed",
      "closed",
    ]),
    boardSlug: z.string().min(1),
  }),
  similarityScore: z.number().min(0).max(1),
})

export const junoCreateFeedbackActionSchema = z.object({
  type: z.literal("create_feedback"),
  boardId: z.string().min(1),
  boardSlug: z.string().min(1),
  draft: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
  }),
})

export const junoActionPayloadSchema = z.discriminatedUnion("type", [
  junoSimilarPostActionSchema,
  junoCreateFeedbackActionSchema,
])

export type JunoSimilarPostAction = z.infer<typeof junoSimilarPostActionSchema>
export type JunoCreateFeedbackAction = z.infer<
  typeof junoCreateFeedbackActionSchema
>
export type JunoActionPayload = z.infer<typeof junoActionPayloadSchema>
export type JunoActionType = JunoActionPayload["type"]

export interface JunoStreamChunk {
  text?: string
  action?: JunoActionPayload
}
