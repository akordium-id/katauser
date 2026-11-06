import { describe, it, expect } from 'vitest';
import { app } from '../src/app';

describe('Feedback Hono API Routes', () => {
  let createdBoardId: string;
  let createdPostId: string;

  it('POST /api/v1/workspaces/:slug/boards creates a board', async () => {
    const res = await app.request('/api/v1/workspaces/acme/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Feature Requests',
        slug: 'feature-requests',
        description: 'Tell us what to build',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.board.name).toBe('Feature Requests');
    createdBoardId = data.board.id;
  });

  it('GET /api/v1/workspaces/:slug/boards lists boards for workspace', async () => {
    const res = await app.request('/api/v1/workspaces/acme/boards');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.boards)).toBe(true);
  });

  it('POST /api/v1/boards/:boardId/posts creates a post in board', async () => {
    const res = await app.request(`/api/v1/boards/${createdBoardId || 'b_1'}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: createdBoardId || 'b_1',
        title: 'CSV Export Feature',
        content: 'We need to export analytics data to CSV format.',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.post.title).toBe('CSV Export Feature');
    createdPostId = data.post.id;
  });

  it('GET /api/v1/boards/:boardId/posts retrieves posts with sorting', async () => {
    const res = await app.request(`/api/v1/boards/${createdBoardId || 'b_1'}/posts?sort=newest`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.posts)).toBe(true);
  });

  it('POST /api/v1/posts/:postId/vote toggles upvote', async () => {
    const res = await app.request(`/api/v1/posts/${createdPostId || 'p_1'}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId: createdPostId || 'p_1',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.voted).toBe('boolean');
  });

  it('POST /api/v1/posts/:postId/comments adds a comment', async () => {
    const res = await app.request(`/api/v1/posts/${createdPostId || 'p_1'}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'This is high priority for our team.',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.comment.content).toBe('This is high priority for our team.');
  });

  it('PATCH /api/v1/posts/:postId/status updates post status', async () => {
    const res = await app.request(`/api/v1/posts/${createdPostId || 'p_1'}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'in_progress',
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.post.status).toBe('in_progress');
  });
});
