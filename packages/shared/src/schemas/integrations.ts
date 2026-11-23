import { z } from "zod"

export const webhookEventTypes = [
  "post.created",
  "post.voted",
  "chat.escalated",
] as const
export type WebhookEventType = (typeof webhookEventTypes)[number]

export const webhookConfigSchema = z.object({
  slackWebhookUrl: z
    .string()
    .url("URL Slack Webhook tidak valid")
    .optional()
    .or(z.literal("")),
  discordWebhookUrl: z
    .string()
    .url("URL Discord Webhook tidak valid")
    .optional()
    .or(z.literal("")),
  enabledEvents: z
    .array(z.enum(webhookEventTypes))
    .default(["post.created", "post.voted", "chat.escalated"]),
})

export type WebhookConfig = z.infer<typeof webhookConfigSchema>

export interface WebhookEvent {
  event: WebhookEventType
  workspaceSlug: string
  timestamp: string
  data: {
    title?: string
    content?: string
    authorName?: string
    authorEmail?: string
    votesCount?: number
    mrrImpact?: number
    url?: string
    conversationId?: string
    initialMessage?: string
  }
}

// Linear Integration Schemas
export const saveLinearIntegrationSchema = z.object({
  apiKey: z.string().min(1, "API Key Linear wajib diisi"),
  webhookSecret: z.string().min(1, "Webhook Secret wajib diisi"),
  defaultTeamId: z.string().optional(),
})

export type SaveLinearIntegrationInput = z.infer<
  typeof saveLinearIntegrationSchema
>

export const createLinearIssueSchema = z.object({
  postId: z.string().min(1, "Post ID wajib diisi"),
  teamId: z.string().min(1, "Pilih tim Linear"),
  title: z.string().min(1, "Judul issue wajib diisi"),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(4).default(0),
})

export type CreateLinearIssueInput = z.infer<typeof createLinearIssueSchema>

export const linkLinearIssueSchema = z.object({
  postId: z.string().min(1, "Post ID wajib diisi"),
  issueIdOrKey: z
    .string()
    .trim()
    .regex(
      /^([A-Za-z0-9]+-\d+|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
      "Format identifier harus berupa kode tim (misal ENG-142) atau UUID Linear",
    ),
})

export type LinkLinearIssueInput = z.infer<typeof linkLinearIssueSchema>
