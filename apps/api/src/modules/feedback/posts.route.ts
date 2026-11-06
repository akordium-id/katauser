import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  createPostSchema,
  updatePostStatusSchema,
  createCommentSchema,
  type UserTraits,
} from '@katauser/shared';
import { createRateLimiter } from '../../middleware/rate-limiter';
import { getWorkspaceWebhookConfig } from '../integrations/integrations.route';
import { dispatchWebhookEvent } from '../integrations/webhook-dispatcher';
import { sendVoterNotificationEmail } from '../../services/email-notifier';

// In-memory mock store for posts, votes, comments
interface PostRecord {
  id: string;
  boardId: string;
  title: string;
  content: string;
  status: string;
  votesCount: number;
  totalMrr: number;
  commentsCount: number;
  createdAt: string;
}

interface VoteRecord {
  postId: string;
  userId: string;
  userEmail?: string;
  traits?: UserTraits;
}

const postsStore: PostRecord[] = [];
const votesStore: VoteRecord[] = [];

const commentsStore: Array<{
  id: string;
  postId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}> = [];

function calculatePostMrr(postId: string): number {
  return votesStore
    .filter((v) => v.postId === postId)
    .reduce((sum, v) => sum + (v.traits?.mrr ?? 0), 0);
}

export const postsRoute = new Hono()
  .get(
    '/boards/:boardId/posts',
    zValidator(
      'query',
      z.object({
        sort: z.enum(['top_voted', 'newest', 'top_mrr']).optional(),
        status: z.string().optional(),
      })
    ),
    (c) => {
      const boardId = c.req.param('boardId');
      const { sort = 'top_voted', status } = c.req.valid('query');

      let filtered = postsStore.filter((p) => p.boardId === boardId);
      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      }

      if (sort === 'newest') {
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sort === 'top_mrr') {
        filtered.sort((a, b) => b.totalMrr - a.totalMrr);
      } else {
        filtered.sort((a, b) => b.votesCount - a.votesCount);
      }

      return c.json({ posts: filtered });
    }
  )
  .post(
    '/boards/:boardId/posts',
    zValidator('json', createPostSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const boardId = c.req.param('boardId');
      const data = c.req.valid('json');

      const newPost: PostRecord = {
        id: 'post_' + Math.random().toString(36).substring(2, 10),
        boardId,
        title: data.title,
        content: data.content,
        status: 'pending',
        votesCount: 0,
        totalMrr: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };

      postsStore.push(newPost);

      // Async dispatch webhook post.created
      const webhookConfig = getWorkspaceWebhookConfig('acme');
      if (webhookConfig) {
        dispatchWebhookEvent(webhookConfig, {
          event: 'post.created',
          workspaceSlug: 'acme',
          timestamp: newPost.createdAt,
          data: {
            title: newPost.title,
            content: newPost.content,
            authorName: 'Pengguna',
            url: `https://katauser.com/b/feedback/${newPost.id}`,
          },
        }).catch(() => {});
      }

      return c.json({ success: true, post: newPost }, 201);
    }
  )
  .post(
    '/posts/:postId/vote',
    createRateLimiter({ max: 5, windowMs: 60000 }),
    async (c) => {
      const postId = c.req.param('postId');
      if (!postId) {
        return c.json({ success: false, message: 'Post ID is required' }, 400);
      }
      const userId = c.req.header('x-user-id') || 'guest_user';
      const userEmail = c.req.header('x-user-email');

      let traits: UserTraits | undefined;
      const traitsHeader = c.req.header('x-user-traits');
      if (traitsHeader) {
        try {
          traits = JSON.parse(traitsHeader);
        } catch {}
      }

      const existingIndex = votesStore.findIndex(
        (v) => v.postId === postId && v.userId === userId
      );

      const post = postsStore.find((p) => p.id === postId);

      if (existingIndex > -1) {
        // unvote
        votesStore.splice(existingIndex, 1);
        if (post) {
          post.votesCount = Math.max(0, post.votesCount - 1);
          post.totalMrr = calculatePostMrr(postId);
        }
        return c.json({
          success: true,
          voted: false,
          votesCount: post?.votesCount ?? 0,
          totalMrr: post?.totalMrr ?? 0,
        });
      } else {
        // vote
        votesStore.push({ postId, userId, userEmail, traits });
        if (post) {
          post.votesCount += 1;
          post.totalMrr = calculatePostMrr(postId);
        }

        // Async dispatch webhook post.voted
        const webhookConfig = getWorkspaceWebhookConfig('acme');
        if (webhookConfig && post) {
          dispatchWebhookEvent(webhookConfig, {
            event: 'post.voted',
            workspaceSlug: 'acme',
            timestamp: new Date().toISOString(),
            data: {
              title: post.title,
              votesCount: post.votesCount,
              mrrImpact: traits?.mrr,
              url: `https://katauser.com/b/feedback/${post.id}`,
            },
          }).catch(() => {});
        }

        return c.json({
          success: true,
          voted: true,
          votesCount: post?.votesCount ?? 1,
          totalMrr: post?.totalMrr ?? 0,
        });
      }
    }
  )
  .get('/posts/:postId/comments', (c) => {
    const postId = c.req.param('postId');
    const filtered = commentsStore.filter((cm) => cm.postId === postId);
    return c.json({ comments: filtered });
  })
  .post(
    '/posts/:postId/comments',
    zValidator('json', createCommentSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const postId = c.req.param('postId');
      const data = c.req.valid('json');

      const newComment = {
        id: 'comment_' + Math.random().toString(36).substring(2, 10),
        postId,
        content: data.content,
        isInternal: data.isInternal ?? false,
        createdAt: new Date().toISOString(),
      };

      commentsStore.push(newComment);
      const post = postsStore.find((p) => p.id === postId);
      if (post) post.commentsCount += 1;

      return c.json({ success: true, comment: newComment }, 201);
    }
  )
  .patch(
    '/posts/:postId/status',
    zValidator('json', updatePostStatusSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const postId = c.req.param('postId');
      const { status } = c.req.valid('json');

      const post = postsStore.find((p) => p.id === postId);
      if (!post) {
        return c.json({ success: false, error: 'Post not found' }, 404);
      }

      post.status = status;
      let notificationsSent = 0;

      // Check if status qualifies for voter notification
      const notifiableStatuses = ['planned', 'in_progress', 'shipped', 'completed'];
      if (notifiableStatuses.includes(status)) {
        const votersWithEmail = votesStore.filter(
          (v) => v.postId === postId && v.userEmail
        );

        const mappedStatus = status === 'completed' ? 'shipped' : (status as any);

        for (const voter of votersWithEmail) {
          if (voter.userEmail) {
            sendVoterNotificationEmail({
              recipientEmail: voter.userEmail,
              workspaceName: 'Acme SaaS',
              postTitle: post.title,
              newStatus: mappedStatus,
              postUrl: `https://acme.katauser.com/b/feedback/${post.id}`,
            }).catch(() => {});
            notificationsSent += 1;
          }
        }
      }

      return c.json({ success: true, post, notificationsSent });
    }
  );
