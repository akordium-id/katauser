import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chunkText,
  cosineSimilarity,
  generateEmbedding,
} from '../src/services/ai-embeddings';

describe('AI Embeddings & Vector Similarity Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('splits long text into overlapping chunks cleanly', () => {
    const text = 'Paragraph 1: Welcome to Katauser.\n\nParagraph 2: Features include feedback boards.\n\nParagraph 3: Live chat Juno AI support.';
    const chunks = chunkText(text, 50, 10);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0]).toContain('Welcome to Katauser');
  });

  it('calculates cosine similarity between two normalized vectors accurately', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0, 4);
    expect(cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0, 4);
  });

  it('generates deterministic normalized 1536-dim embedding vector in mock fallback mode', async () => {
    const vec1 = await generateEmbedding('Dark mode support', undefined);
    const vec2 = await generateEmbedding('Dark mode support', undefined);
    const vecDiff = await generateEmbedding('Billing invoice receipt', undefined);

    expect(vec1.length).toBe(1536);
    expect(vec2.length).toBe(1536);
    // Identical text produces similarity of 1.0
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1.0, 4);
    // Different text produces noticeably lower similarity
    expect(cosineSimilarity(vec1, vecDiff)).toBeLessThan(0.9);
  });

  it('calls OpenAI v1/embeddings API when api key is provided', async () => {
    const mockVector = new Array(1536).fill(0.01);
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ embedding: mockVector }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await generateEmbedding('Testing OpenAI API', 'sk-test-fake-key');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test-fake-key',
        }),
      })
    );
    expect(result).toEqual(mockVector);
  });
});

