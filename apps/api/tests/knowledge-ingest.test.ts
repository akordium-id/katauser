import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../src/app';

describe('Knowledge Base Ingestion & Semantic Search API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ingests a product documentation article, chunks it, and creates vector embeddings', async () => {
    const doc = {
      title: 'Panduan Penagihan & Faktur',
      content:
        'Sistem penagihan Katauser mendukung kartu kredit, transfer bank, dan QRIS. Semua faktur bulanan dapat diunduh langsung melalui menu Dashboard > Settings > Billing pada tanggal 1 setiap bulannya.',
      sourceUrl: 'https://docs.acme.com/billing',
      sourceType: 'doc',
    };

    const res = await app.request('/api/v1/workspaces/acme/knowledge/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.document.title).toBe(doc.title);
    expect(json.document.chunksCount).toBeGreaterThanOrEqual(1);
  });

  it('lists all ingested knowledge documents for a workspace', async () => {
    const res = await app.request('/api/v1/workspaces/acme/knowledge');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.documents)).toBe(true);
    expect(json.documents.length).toBeGreaterThanOrEqual(1);
  });

  it('performs semantic vector search across ingested knowledge chunks', async () => {
    const searchRes = await app.request('/api/v1/workspaces/acme/knowledge/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'faktur bulanan dapat diunduh',
        threshold: 0.3,
        limit: 3,
      }),
    });

    expect(searchRes.status).toBe(200);
    const searchJson = await searchRes.json();
    expect(searchJson.success).toBe(true);
    expect(searchJson.results.length).toBeGreaterThanOrEqual(1);
    expect(searchJson.results[0].text).toContain('faktur bulanan dapat diunduh');
    expect(searchJson.results[0].score).toBeGreaterThan(0.3);
  });
});
