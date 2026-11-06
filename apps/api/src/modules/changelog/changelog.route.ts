import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createChangelogSchema } from '@katauser/shared';

const changelogsStore: Array<{
  id: string;
  workspaceId: string;
  title: string;
  slug: string;
  content: string;
  postIds?: string[];
  publishedAt: string;
  createdAt: string;
}> = [];

export const changelogRoute = new Hono()
  .get('/workspaces/:slug/changelogs', (c) => {
    const slug = c.req.param('slug');
    const filtered = changelogsStore.filter((ch) => ch.workspaceId === slug);
    return c.json({
      success: true,
      changelogs: filtered,
    });
  })
  .post(
    '/workspaces/:slug/changelogs',
    zValidator('json', createChangelogSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const slug = c.req.param('slug');
      const data = c.req.valid('json');

      const newChangelog = {
        id: 'ch_' + Math.random().toString(36).substring(2, 10),
        workspaceId: slug,
        title: data.title,
        slug: data.slug,
        content: data.content,
        postIds: data.postIds ?? [],
        publishedAt: data.publishedAt ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      changelogsStore.push(newChangelog);

      return c.json(
        {
          success: true,
          changelog: newChangelog,
        },
        201
      );
    }
  );

