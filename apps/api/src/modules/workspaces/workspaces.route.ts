import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createWorkspaceSchema } from '@katauser/shared';

export const workspacesRoute = new Hono()
  .get('/', (c) => {
    return c.json({
      workspaces: [],
    });
  })
  .post(
    '/',
    zValidator('json', createWorkspaceSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            errors: result.error.errors,
          },
          400
        );
      }
    }),
    async (c) => {
      const data = c.req.valid('json');
      const mockWorkspace = {
        id: 'ws_' + Math.random().toString(36).substring(2, 9),
        name: data.name,
        slug: data.slug,
        customDomain: data.customDomain ?? null,
        plan: 'free',
        createdAt: new Date().toISOString(),
      };

      return c.json(
        {
          success: true,
          workspace: mockWorkspace,
        },
        201
      );
    }
  );

