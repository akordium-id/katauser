import { describe, it, expect } from 'vitest';
import { app } from '../src/app';

describe('Hono API Routes', () => {
  it('GET /api/v1/health returns ok status', async () => {
    const res = await app.request('/api/v1/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('POST /api/v1/workspaces rejects invalid slug with 400', async () => {
    const res = await app.request('/api/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Acme', slug: 'INVALID SLUG!' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('POST /api/v1/workspaces succeeds with valid payload', async () => {
    const res = await app.request('/api/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Katauser Demo', slug: 'katauser-demo' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.workspace.slug).toBe('katauser-demo');
  });
});

