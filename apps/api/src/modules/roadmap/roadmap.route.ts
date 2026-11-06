import { Hono } from 'hono';

export const roadmapRoute = new Hono().get(
  '/workspaces/:slug/roadmap',
  (c) => {
    // In-memory mock or repository call
    const roadmap = {
      planned: [
        {
          id: 'post_p1',
          title: 'Slack Notifications Integration',
          content: 'Receive instant notifications when new feedback arrives.',
          status: 'planned',
          votesCount: 42,
          commentsCount: 5,
        },
      ],
      inProgress: [
        {
          id: 'post_ip1',
          title: 'Custom Domain SSL Auto-provisioning',
          content: 'Automatic SSL certificate setup for custom portal domains.',
          status: 'in_progress',
          votesCount: 88,
          commentsCount: 12,
        },
      ],
      completed: [
        {
          id: 'post_c1',
          title: 'SvelteKit 2 + Svelte 5 Modernization',
          content: 'Upgraded entire frontend codebase to modern reactive runes.',
          status: 'completed',
          votesCount: 154,
          commentsCount: 23,
        },
      ],
    };

    return c.json({
      success: true,
      roadmap,
    });
  }
);
