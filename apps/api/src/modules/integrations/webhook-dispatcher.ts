import type { WebhookConfig, WebhookEvent } from '@katauser/shared';

/**
 * Format payload for Slack Incoming Webhook (Block Kit)
 */
export function formatSlackPayload(event: WebhookEvent): Record<string, any> {
  const { data, workspaceSlug, timestamp } = event;

  if (event.event === 'post.created') {
    return {
      text: `💡 Ide Feedback Baru di Katauser (${workspaceSlug}): ${data.title}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '💡 Ide Feedback Baru',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<${data.url || '#'}|${data.title}>*\n${data.content || 'Tanpa deskripsi'}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Oleh: *${data.authorName || 'Anonim'}* (${data.authorEmail || '-'}) • Workspace: *${workspaceSlug}*`,
            },
          ],
        },
      ],
    };
  }

  if (event.event === 'post.voted') {
    const mrrText = data.mrrImpact ? ` • Revenue Impact: *+$${data.mrrImpact}/mo*` : '';
    return {
      text: `👍 Upvote Baru: ${data.title} (Total: ${data.votesCount || 1} votes)`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👍 *<${data.url || '#'}|${data.title}>* menerima vote baru!\nTotal: *${data.votesCount || 1} votes*${mrrText}`,
          },
        },
      ],
    };
  }

  // chat.escalated
  return {
    text: `🚨 Live Chat Butuh Bantuan Staf (${workspaceSlug})`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Live Chat Membutuhkan Respon Manusia',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `User *${data.authorName || 'Pelanggan'}* meminta eskalasi bantuan:\n> "${data.initialMessage || 'Customer meminta berbicara dengan staf'}"`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Buka Admin Inbox',
              emoji: true,
            },
            url: data.url || '#',
            style: 'danger',
          },
        ],
      },
    ],
  };
}

/**
 * Format payload for Discord Webhook (Rich Embeds)
 */
export function formatDiscordPayload(event: WebhookEvent): Record<string, any> {
  const { data, workspaceSlug, timestamp } = event;

  if (event.event === 'post.created') {
    return {
      embeds: [
        {
          title: `💡 [${workspaceSlug}] Ide Feedback Baru: ${data.title}`,
          description: data.content || 'Tanpa deskripsi',
          url: data.url || undefined,
          color: 0x3b82f6, // Blue
          fields: [
            {
              name: 'Penulis',
              value: `${data.authorName || 'Anonim'} (${data.authorEmail || '-'})`,
              inline: true,
            },
          ],
          timestamp: timestamp || new Date().toISOString(),
        },
      ],
    };
  }

  if (event.event === 'post.voted') {
    const fields = [
      {
        name: 'Total Votes',
        value: `${data.votesCount || 1}`,
        inline: true,
      },
    ];
    if (data.mrrImpact) {
      fields.push({
        name: 'MRR Impact',
        value: `$${data.mrrImpact}/mo`,
        inline: true,
      });
    }

    return {
      embeds: [
        {
          title: `👍 Upvote Baru: ${data.title}`,
          url: data.url || undefined,
          color: 0x10b981, // Emerald green
          fields,
          timestamp: timestamp || new Date().toISOString(),
        },
      ],
    };
  }

  // chat.escalated
  return {
    embeds: [
      {
        title: `🚨 [${workspaceSlug}] Live Chat Butuh Bantuan Staf`,
        description: data.initialMessage || 'Customer meminta dialihkan ke agen manusia.',
        url: data.url || undefined,
        color: 0xe11d48, // Rose red
        fields: [
          {
            name: 'Customer',
            value: data.authorName || 'Pengguna',
            inline: true,
          },
          {
            name: 'ID Percakapan',
            value: data.conversationId || '-',
            inline: true,
          },
        ],
        timestamp: timestamp || new Date().toISOString(),
      },
    ],
  };
}

/**
 * Dispatch webhook event to Slack and Discord without throwing or blocking
 */
export async function dispatchWebhookEvent(
  config: WebhookConfig,
  event: WebhookEvent
): Promise<{ slackSuccess?: boolean; discordSuccess?: boolean }> {
  const result: { slackSuccess?: boolean; discordSuccess?: boolean } = {};

  if (!config.enabledEvents.includes(event.event)) {
    return result;
  }

  const promises: Promise<void>[] = [];

  if (config.slackWebhookUrl) {
    const slackPayload = formatSlackPayload(event);
    promises.push(
      fetch(config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
        signal: AbortSignal.timeout(4000),
      })
        .then((res) => {
          result.slackSuccess = res.ok;
        })
        .catch(() => {
          result.slackSuccess = false;
        })
    );
  }

  if (config.discordWebhookUrl) {
    const discordPayload = formatDiscordPayload(event);
    promises.push(
      fetch(config.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
        signal: AbortSignal.timeout(4000),
      })
        .then((res) => {
          result.discordSuccess = res.ok;
        })
        .catch(() => {
          result.discordSuccess = false;
        })
    );
  }

  await Promise.allSettled(promises);
  return result;
}

