import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { healthRoute } from './modules/health/health.route';
import { workspacesRoute } from './modules/workspaces/workspaces.route';
import { boardsRoute } from './modules/feedback/boards.route';
import { postsRoute } from './modules/feedback/posts.route';

export const app = new Hono()
  .use(
    '*',
    cors({
      origin: (origin) => origin ?? '*',
      allowHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Slug', 'X-User-Id'],
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    })
  )
  .basePath('/api/v1')
  .route('/health', healthRoute)
  .route('/workspaces', workspacesRoute)
  .route('/', boardsRoute)
  .route('/', postsRoute);

export type AppType = typeof app;
