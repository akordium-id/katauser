import { describe, it, expect } from 'vitest';
import { app } from '../src/app';
import { generateUserHmac } from '@katauser/shared';

describe('Widget Identify Hono API Route', () => {
  const secretKey = 'test-workspace-secret-key';

  it('identifies user with valid HMAC signature', async () => {
    const userId = 'user_abc_456';
    const hash = generateUserHmac(secretKey, userId);

    const res = await app.request('/api/v1/widget/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: 'acme-corp',
        userId,
        email: 'alex@example.com',
        name: 'Alex Rivera',
        hash,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.userId).toBe(userId);
    expect(data.user.email).toBe('alex@example.com');
    expect(data.user.verified).toBe(true);
    expect(typeof data.sessionToken).toBe('string');
  });

  it('rejects user when HMAC hash is invalid and verification is requested', async () => {
    const res = await app.request('/api/v1/widget/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: 'acme-corp',
        userId: 'user_impostor',
        email: 'impostor@example.com',
        hash: 'invalid_hash_signature_12345',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('HMAC');
  });

  it('allows unverified guest identification when no hash is provided', async () => {
    const res = await app.request('/api/v1/widget/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: 'acme-corp',
        userId: 'guest_anonymous_99',
        email: 'guest@example.com',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.verified).toBe(false);
    expect(typeof data.sessionToken).toBe('string');
  });
});

