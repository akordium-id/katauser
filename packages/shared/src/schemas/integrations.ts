import { z } from 'zod';

export const webhookEventTypes = ['post.created', 'post.voted', 'chat.escalated'] as const;
export type WebhookEventType = (typeof webhookEventTypes)[number];

export const webhookConfigSchema = z.object({
  slackWebhookUrl: z.string().url('URL Slack Webhook tidak valid').optional().or(z.literal('')),
  discordWebhookUrl: z.string().url('URL Discord Webhook tidak valid').optional().or(z.literal('')),
  enabledEvents: z.array(z.enum(webhookEventTypes)).default(['post.created', 'post.voted', 'chat.escalated']),
});

export type WebhookConfig = z.infer<typeof webhookConfigSchema>;

export interface WebhookEvent {
  event: WebhookEventType;
  workspaceSlug: string;
  timestamp: string;
  data: {
    title?: string;
    content?: string;
    authorName?: string;
    authorEmail?: string;
    votesCount?: number;
    mrrImpact?: number;
    url?: string;
    conversationId?: string;
    initialMessage?: string;
  };
}
