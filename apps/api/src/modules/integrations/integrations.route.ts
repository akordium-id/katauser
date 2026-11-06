import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  webhookConfigSchema,
  type WebhookConfig,
  type WebhookEvent,
} from '@katauser/shared';
import { dispatchWebhookEvent } from './webhook-dispatcher';

// In-memory store per workspace
const workspaceIntegrationsStore: Record<string, { webhook: WebhookConfig }> = {};

export function getWorkspaceWebhookConfig(workspaceSlug: string): WebhookConfig | undefined {
  return workspaceIntegrationsStore[workspaceSlug]?.webhook;
}

export const integrationsRoute = new Hono()
  // Get integration settings
  .get('/workspaces/:slug/integrations', (c) => {
    const slug = c.req.param('slug');
    const config = workspaceIntegrationsStore[slug]?.webhook || {
      slackWebhookUrl: '',
      discordWebhookUrl: '',
      enabledEvents: ['post.created', 'post.voted', 'chat.escalated'],
    };

    return c.json({ success: true, webhook: config });
  })

  // Save/update webhook configuration
  .post(
    '/workspaces/:slug/integrations/webhook',
    zValidator('json', webhookConfigSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const slug = c.req.param('slug');
      const data = c.req.valid('json');

      workspaceIntegrationsStore[slug] = {
        webhook: {
          slackWebhookUrl: data.slackWebhookUrl || '',
          discordWebhookUrl: data.discordWebhookUrl || '',
          enabledEvents: data.enabledEvents || ['post.created', 'post.voted', 'chat.escalated'],
        },
      };

      return c.json({ success: true, webhook: workspaceIntegrationsStore[slug].webhook });
    }
  )

  // Test webhook endpoint
  .post('/workspaces/:slug/integrations/webhook/test', async (c) => {
    const slug = c.req.param('slug');
    const config = workspaceIntegrationsStore[slug]?.webhook;

    if (!config || (!config.slackWebhookUrl && !config.discordWebhookUrl)) {
      return c.json(
        { success: false, message: 'URL Webhook Slack atau Discord belum dikonfigurasi' },
        400
      );
    }

    const testEvent: WebhookEvent = {
      event: 'post.created',
      workspaceSlug: slug,
      timestamp: new Date().toISOString(),
      data: {
        title: 'Pengujian Integrasi Webhook Katauser',
        content: 'Ini adalah notifikasi uji coba koneksi dari Katauser.',
        authorName: 'Sistem Katauser',
        authorEmail: 'test@katauser.com',
        url: `https://katauser.com/dashboard/${slug}/settings/integrations`,
      },
    };

    const result = await dispatchWebhookEvent(config, testEvent);
    return c.json({ success: true, result });
  });
