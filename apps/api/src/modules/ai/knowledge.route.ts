import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  ingestDocumentSchema,
  similarityQuerySchema,
} from '@katauser/shared';
import {
  chunkText,
  generateEmbedding,
  cosineSimilarity,
} from '../../services/ai-embeddings';

interface KnowledgeChunk {
  id: string;
  text: string;
  embedding: number[];
}

interface IngestedDocument {
  id: string;
  workspaceSlug: string;
  title: string;
  content: string;
  sourceUrl?: string;
  sourceType: string;
  chunks: KnowledgeChunk[];
  createdAt: string;
}

const knowledgeStore: IngestedDocument[] = [];

/**
 * Retrieve top relevant context chunks for a query
 */
export async function findRelevantKnowledgeContext(
  workspaceSlug: string,
  query: string,
  limit = 3
): Promise<string[]> {
  const docs = knowledgeStore.filter((d) => d.workspaceSlug === workspaceSlug);
  if (docs.length === 0) return [];

  const queryEmbedding = await generateEmbedding(query);
  const candidates: Array<{ text: string; score: number }> = [];

  for (const doc of docs) {
    for (const chunk of doc.chunks) {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= 0.25) {
        candidates.push({ text: chunk.text, score });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit).map((c) => c.text);
}

export const knowledgeRoute = new Hono()
  // Ingest document (website doc / FAQ)
  .post(
    '/workspaces/:slug/knowledge/ingest',
    zValidator('json', ingestDocumentSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const workspaceSlug = c.req.param('slug');
      const data = c.req.valid('json');

      const rawChunks = chunkText(data.content, 400, 40);
      const chunks: KnowledgeChunk[] = [];

      for (const text of rawChunks) {
        const embedding = await generateEmbedding(text);
        chunks.push({
          id: 'chunk_' + Math.random().toString(36).substring(2, 10),
          text,
          embedding,
        });
      }

      const doc: IngestedDocument = {
        id: 'doc_' + Math.random().toString(36).substring(2, 10),
        workspaceSlug,
        title: data.title,
        content: data.content,
        sourceUrl: data.sourceUrl || undefined,
        sourceType: data.sourceType,
        chunks,
        createdAt: new Date().toISOString(),
      };

      knowledgeStore.push(doc);

      return c.json(
        {
          success: true,
          document: {
            id: doc.id,
            title: doc.title,
            chunksCount: doc.chunks.length,
          },
        },
        201
      );
    }
  )

  // List all knowledge documents for a workspace
  .get('/workspaces/:slug/knowledge', (c) => {
    const workspaceSlug = c.req.param('slug');
    const docs = knowledgeStore
      .filter((d) => d.workspaceSlug === workspaceSlug)
      .map((d) => ({
        id: d.id,
        title: d.title,
        sourceType: d.sourceType,
        sourceUrl: d.sourceUrl,
        chunksCount: d.chunks.length,
        createdAt: d.createdAt,
      }));

    return c.json({ success: true, documents: docs });
  })

  // Semantic search across knowledge chunks
  .post(
    '/workspaces/:slug/knowledge/search',
    zValidator('json', similarityQuerySchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const workspaceSlug = c.req.param('slug');
      const { query, threshold, limit } = c.req.valid('json');

      const queryEmbedding = await generateEmbedding(query);
      const docs = knowledgeStore.filter((d) => d.workspaceSlug === workspaceSlug);

      const results: Array<{
        text: string;
        score: number;
        documentTitle: string;
        sourceUrl?: string;
      }> = [];

      for (const doc of docs) {
        for (const chunk of doc.chunks) {
          const score = cosineSimilarity(queryEmbedding, chunk.embedding);
          if (score >= threshold) {
            results.push({
              text: chunk.text,
              score,
              documentTitle: doc.title,
              sourceUrl: doc.sourceUrl,
            });
          }
        }
      }

      results.sort((a, b) => b.score - a.score);

      return c.json({
        success: true,
        results: results.slice(0, limit),
      });
    }
  );

