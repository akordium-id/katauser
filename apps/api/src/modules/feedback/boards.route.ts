import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createBoardSchema } from '@katauser/shared';

// In-memory mock store for API tests / fallback when live DB is not connected
const boardsStore: Array<{
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
  allowGuestPosts: boolean;
  createdAt: string;
}> = [];

export const boardsRoute = new Hono()
  .get('/workspaces/:slug/boards', (c) => {
    const slug = c.req.param('slug');
    const filtered = boardsStore.filter((b) => b.workspaceId === slug);
    return c.json({
      boards: filtered,
    });
  })
  .post(
    '/workspaces/:slug/boards',
    zValidator('json', createBoardSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const slug = c.req.param('slug');
      const data = c.req.valid('json');

      const newBoard = {
        id: 'board_' + Math.random().toString(36).substring(2, 10),
        workspaceId: slug,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        isPrivate: data.isPrivate ?? false,
        allowGuestPosts: data.allowGuestPosts ?? true,
        createdAt: new Date().toISOString(),
      };

      boardsStore.push(newBoard);

      return c.json(
        {
          success: true,
          board: newBoard,
        },
        201
      );
    }
  );

