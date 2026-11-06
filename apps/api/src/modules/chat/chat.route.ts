import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { zValidator } from '@hono/zod-validator';
import {
  createConversationSchema,
  sendMessageSchema,
  escalateConversationSchema,
} from '@katauser/shared';

import { getWorkspaceWebhookConfig } from '../integrations/integrations.route';
import { dispatchWebhookEvent } from '../integrations/webhook-dispatcher';

interface ConversationItem {
  id: string;
  workspaceId: string;
  endUserId?: string;
  status: 'open' | 'pending' | 'closed';
  assignedTo: 'ai_juno' | 'human';
  createdAt: string;
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderType: 'end_user' | 'agent' | 'ai';
  senderId: string;
  content: string;
  createdAt: string;
}

const conversationsStore: ConversationItem[] = [];
const messagesStore: MessageItem[] = [];

export const chatRoute = new Hono()
  // Create or resume conversation
  .post(
    '/chat/conversations',
    zValidator('json', createConversationSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const data = c.req.valid('json');
      const convId = 'conv_' + Math.random().toString(36).substring(2, 10);

      const conversation: ConversationItem = {
        id: convId,
        workspaceId: data.workspaceId,
        endUserId: data.endUserId,
        status: 'open',
        assignedTo: 'ai_juno',
        createdAt: new Date().toISOString(),
      };

      conversationsStore.push(conversation);

      if (data.initialMessage) {
        const msgId = 'msg_' + Math.random().toString(36).substring(2, 10);
        messagesStore.push({
          id: msgId,
          conversationId: convId,
          senderType: 'end_user',
          senderId: data.endUserId || 'anonymous',
          content: data.initialMessage,
          createdAt: new Date().toISOString(),
        });
      }

      return c.json({ success: true, conversation }, 201);
    }
  )

  // Get messages for a conversation
  .get('/chat/conversations/:id/messages', (c) => {
    const id = c.req.param('id');
    const messages = messagesStore.filter((m) => m.conversationId === id);
    return c.json({ success: true, messages });
  })

  // Send a message
  .post(
    '/chat/conversations/:id/messages',
    zValidator('json', sendMessageSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const data = c.req.valid('json');
      const msgId = 'msg_' + Math.random().toString(36).substring(2, 10);

      const message: MessageItem = {
        id: msgId,
        conversationId: data.conversationId,
        senderType: data.senderType,
        senderId: data.senderId,
        content: data.content,
        createdAt: new Date().toISOString(),
      };

      messagesStore.push(message);

      return c.json({ success: true, message }, 201);
    }
  )

  // Escalate conversation to human support
  .post(
    '/chat/conversations/:id/escalate',
    zValidator('json', escalateConversationSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const id = c.req.param('id');
      const conv = conversationsStore.find((item) => item.id === id);

      if (!conv) {
        return c.json({ success: false, message: 'Conversation not found' }, 404);
      }

      conv.assignedTo = 'human';

      // Dispatch webhook to Slack/Discord
      const webhookConfig = getWorkspaceWebhookConfig(conv.workspaceId);
      if (webhookConfig) {
        dispatchWebhookEvent(webhookConfig, {
          event: 'chat.escalated',
          workspaceSlug: conv.workspaceId,
          timestamp: new Date().toISOString(),
          data: {
            conversationId: conv.id,
            authorName: conv.endUserId || 'Pelanggan',
            initialMessage: 'Customer meminta bantuan live support manusia',
            url: `https://katauser.com/dashboard/${conv.workspaceId}/inbox`,
          },
        }).catch(() => {});
      }

      // System notification message
      messagesStore.push({
        id: 'msg_sys_' + Math.random().toString(36).substring(2, 10),
        conversationId: id,
        senderType: 'ai',
        senderId: 'system',
        content:
          'Percakapan telah dialihkan ke tim support manusia. Agen kami akan segera bergabung.',
        createdAt: new Date().toISOString(),
      });

      return c.json({ success: true, conversation: conv });
    }
  )

  // AI Juno SSE Streaming response
  .post('/chat/conversations/:id/juno-stream', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({ prompt: '' }));
    const prompt = body.prompt || '';

    // Check for human handoff intent
    const isHumanHandoffRequested =
      /manusia|orang asli|human|staf|agent|admin|bantuan langsung/i.test(prompt);

    const conv = conversationsStore.find((item) => item.id === id);
    if (conv && isHumanHandoffRequested) {
      conv.assignedTo = 'human';

      // Dispatch webhook to Slack/Discord
      const webhookConfig = getWorkspaceWebhookConfig(conv.workspaceId);
      if (webhookConfig) {
        dispatchWebhookEvent(webhookConfig, {
          event: 'chat.escalated',
          workspaceSlug: conv.workspaceId,
          timestamp: new Date().toISOString(),
          data: {
            conversationId: conv.id,
            authorName: conv.endUserId || 'Pelanggan',
            initialMessage: 'Customer meminta bantuan live support manusia',
            url: `https://katauser.com/dashboard/${conv.workspaceId}/inbox`,
          },
        }).catch(() => {});
      }
    }

    const aiMessageChunks = isHumanHandoffRequested
      ? [
          'Saya memahami Anda ingin berbicara dengan staf kami. ',
          'Saya telah mengalihkan percakapan ini ke tim support manusia kami. ',
          'Mohon menunggu sebentar, tim kami akan segera membalas di sini.',
        ]
      : [
          'Halo! Saya Juno dari Katauser. ',
          'Terkait pertanyaan Anda mengenai ',
          prompt ? `"${prompt}": ` : 'fitur ini: ',
          'Anda dapat mengonfigurasi dan mencobanya langsung melalui tab Roadmap atau portal saran. ',
          'Apakah ada hal lain yang bisa saya bantu?',
        ];

    const fullResponse = aiMessageChunks.join('');

    return streamSSE(c, async (stream) => {
      for (const chunk of aiMessageChunks) {
        await stream.writeSSE({ data: JSON.stringify({ text: chunk }) });
        await stream.sleep(20);
      }
      await stream.writeSSE({ data: '[DONE]' });

      // Persist AI message to store
      messagesStore.push({
        id: 'msg_ai_' + Math.random().toString(36).substring(2, 10),
        conversationId: id,
        senderType: 'ai',
        senderId: 'ai_juno',
        content: fullResponse,
        createdAt: new Date().toISOString(),
      });
    });
  })

  // List conversations for admin inbox
  .get('/workspaces/:slug/conversations', (c) => {
    const slug = c.req.param('slug');
    const conversations = conversationsStore.filter(
      (item) => item.workspaceId === slug || item.workspaceId === 'acme-corp'
    );
    return c.json({ success: true, conversations });
  });
