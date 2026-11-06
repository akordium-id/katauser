import { describe, it, expect } from 'vitest';
import { app } from '../src/app';

describe('Roadmap & Changelog Hono API Routes', () => {
  it('GET /api/v1/workspaces/:slug/roadmap returns 3 status columns', async () => {
    const res = await app.request('/api/v1/workspaces/acme/roadmap');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.roadmap.planned)).toBe(true);
    expect(Array.isArray(data.roadmap.inProgress)).toBe(true);
    expect(Array.isArray(data.roadmap.completed)).toBe(true);
  });

  it('POST /api/v1/workspaces/:slug/changelogs creates a changelog', async () => {
    const res = await app.request('/api/v1/workspaces/acme/changelogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Release 1.0: Realtime Chat',
        slug: 'release-1-0-realtime-chat',
        content: 'We launched the real-time chat widget and Juno AI agent.',
        postIds: ['post_123'],
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.changelog.title).toBe('Release 1.0: Realtime Chat');
  });

  it('GET /api/v1/workspaces/:slug/changelogs lists published releases', async () => {
    const res = await app.request('/api/v1/workspaces/acme/changelogs');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.changelogs)).toBe(true);
  });
});

