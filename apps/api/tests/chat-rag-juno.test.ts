import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../src/app';

describe('RAG-Augmented SSE Live Chat Juno', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('augments AI Juno response using retrieved knowledge base context via SSE stream', async () => {
    const workspaceSlug = 'acme-rag';

    // 1. Ingest documentation about refund policy
    await app.request(`/api/v1/workspaces/${workspaceSlug}/knowledge/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Kebijakan Pengembalian Dana (Refund)',
        content:
          'Pengembalian dana (refund) dapat diajukan dalam kurun waktu 14 hari setelah transaksi pembelian. Tim finance kami akan memproses pengembalian dana dalam 3-5 hari kerja.',
        sourceType: 'doc',
      }),
    });

    // 2. Create conversation
    const convRes = await app.request('/api/v1/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: workspaceSlug,
        initialMessage: 'Berapa hari batas waktu untuk pengajuan refund?',
      }),
    });
    const convJson = await convRes.json();
    const convId = convJson.conversation.id;

    // 3. Request Juno SSE stream
    const streamRes = await app.request(`/api/v1/chat/conversations/${convId}/juno-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Berapa hari batas waktu untuk pengajuan refund?',
      }),
    });

    expect(streamRes.status).toBe(200);
    expect(streamRes.headers.get('content-type')).toContain('text/event-stream');

    const rawStreamText = await streamRes.text();
    expect(rawStreamText).toContain('14 hari');
    expect(rawStreamText).toContain('[DONE]');
  });
});

