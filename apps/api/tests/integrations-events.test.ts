import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../src/app';

describe('Integrations & Events Endpoints (Webhooks, Traits, and Notifications)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows saving and retrieving workspace webhook integration configuration', async () => {
    const config = {
      slackWebhookUrl: 'https://hooks.slack.com/services/test/workspace',
      discordWebhookUrl: 'https://discord.com/api/webhooks/test/channel',
      enabledEvents: ['post.created', 'post.voted', 'chat.escalated'],
    };

    const saveRes = await app.request('/api/v1/workspaces/acme/integrations/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    expect(saveRes.status).toBe(200);
    const saveJson = await saveRes.json();
    expect(saveJson.success).toBe(true);

    const getRes = await app.request('/api/v1/workspaces/acme/integrations');
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.webhook.slackWebhookUrl).toBe(config.slackWebhookUrl);
  });

  it('records voter traits (plan & MRR) and calculates revenue impact on upvotes', async () => {
    // 1. Create a post
    const postRes = await app.request('/api/v1/boards/board_123/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Integrasi Single Sign-On SAML',
        content: 'Dukungan Okta & Azure AD untuk login tim kami',
      }),
    });
    const postJson = await postRes.json();
    const postId = postJson.post.id;

    // 2. Vote from an enterprise user with $500 MRR
    const voteRes = await app.request(`/api/v1/posts/${postId}/vote`, {
      method: 'POST',
      headers: {
        'x-user-id': 'usr_enterprise_1',
        'x-user-traits': JSON.stringify({ plan: 'enterprise', mrr: 500, company: 'Goliath Corp' }),
      },
    });

    expect(voteRes.status).toBe(200);
    const voteJson = await voteRes.json();
    expect(voteJson.success).toBe(true);
    expect(voteJson.voted).toBe(true);
    expect(voteJson.totalMrr).toBe(500);
  });

  it('triggers voter email notifications when post status changes to shipped', async () => {
    // Create post
    const postRes = await app.request('/api/v1/boards/board_notif/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Dark Mode UI Theme',
        content: 'Opsi tema gelap di dashboard admin',
      }),
    });
    const postJson = await postRes.json();
    const postId = postJson.post.id;

    // Vote with email
    await app.request(`/api/v1/posts/${postId}/vote`, {
      method: 'POST',
      headers: {
        'x-user-id': 'usr_darkmode_fan',
        'x-user-email': 'fan@example.com',
      },
    });

    // Update status to shipped
    const statusRes = await app.request(`/api/v1/posts/${postId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'shipped' }),
    });

    expect(statusRes.status).toBe(200);
    const statusJson = await statusRes.json();
    expect(statusJson.success).toBe(true);
    expect(statusJson.post.status).toBe('shipped');
    expect(statusJson.notificationsSent).toBeGreaterThanOrEqual(1);
  });
});

