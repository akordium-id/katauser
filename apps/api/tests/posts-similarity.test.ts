import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../src/app';

describe('Semantic Duplicate Detection in Feedback Posts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects existing similar posts based on semantic cosine similarity', async () => {
    const boardId = 'board_sim_1';

    // 1. Create initial post
    const postRes = await app.request(`/api/v1/boards/${boardId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Dark Mode Support for Dashboard',
        content: 'Please add a dark theme option for night usage to protect our eyes.',
      }),
    });
    expect(postRes.status).toBe(201);

    // 2. Query similar posts with slightly different wording
    const simRes = await app.request(`/api/v1/boards/${boardId}/posts/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Dark theme option for night usage',
        threshold: 0.4,
        limit: 3,
      }),
    });

    expect(simRes.status).toBe(200);
    const simJson = await simRes.json();
    expect(simJson.success).toBe(true);
    expect(simJson.similarPosts.length).toBeGreaterThanOrEqual(1);
    expect(simJson.similarPosts[0].title).toBe('Dark Mode Support for Dashboard');
    expect(simJson.similarPosts[0].similarityScore).toBeGreaterThan(0.4);
  });

  it('returns empty array when no similar posts exceed the threshold', async () => {
    const boardId = 'board_sim_1';

    const simRes = await app.request(`/api/v1/boards/${boardId}/posts/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Integrasi Pembayaran Stripe dan PayPal',
        content: 'Mendukung multi-currency checkout untuk pelanggan global',
        threshold: 0.8,
      }),
    });

    expect(simRes.status).toBe(200);
    const simJson = await simRes.json();
    expect(simJson.success).toBe(true);
    expect(simJson.similarPosts.length).toBe(0);
  });
});
