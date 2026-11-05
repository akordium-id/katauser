import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { healthRoute } from './modules/health/health.route';
import { workspacesRoute } from './modules/workspaces/workspaces.route';

export const app = new Hono()
  .use(
    '*',
    cors({
      origin: (origin) => origin ?? '*',
      allowHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Slug'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    })
  )
  .basePath('/api/v1')
  .route('/health', healthRoute)
  .route('/workspaces', workspacesRoute);

export type AppType = typeof app;
