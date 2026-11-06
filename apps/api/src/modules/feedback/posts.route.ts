import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  createPostSchema,
  updatePostStatusSchema,
  createCommentSchema,
} from '@katauser/shared';

// In-memory mock store for posts, votes, comments
const postsStore: Array<{
  id: string;
  boardId: string;
  title: string;
  content: string;
  status: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
}> = [];

const votesStore: Array<{
  postId: string;
  userId: string;
}> = [];

const commentsStore: Array<{
  id: string;
  postId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}> = [];

export const postsRoute = new Hono()
  .get(
    '/boards/:boardId/posts',
    zValidator(
      'query',
      z.object({
        sort: z.enum(['top_voted', 'newest']).optional(),
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
    } else {
      filtered.sort((a, b) => b.votesCount - a.votesCount);
    }

    return c.json({ posts: filtered });
  })
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

      const newPost = {
        id: 'post_' + Math.random().toString(36).substring(2, 10),
        boardId,
        title: data.title,
        content: data.content,
        status: 'pending',
        votesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };

      postsStore.push(newPost);
      return c.json({ success: true, post: newPost }, 201);
    }
  )
  .post('/posts/:postId/vote', async (c) => {
    const postId = c.req.param('postId');
    const userId = c.req.header('x-user-id') || 'guest_user';

    const existingIndex = votesStore.findIndex(
      (v) => v.postId === postId && v.userId === userId
    );

    const post = postsStore.find((p) => p.id === postId);

    if (existingIndex > -1) {
      // unvote
      votesStore.splice(existingIndex, 1);
      if (post) post.votesCount = Math.max(0, post.votesCount - 1);
      return c.json({ success: true, voted: false, votesCount: post?.votesCount ?? 0 });
    } else {
      // vote
      votesStore.push({ postId, userId });
      if (post) post.votesCount += 1;
      return c.json({ success: true, voted: true, votesCount: post?.votesCount ?? 1 });
    }
  })
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
      return c.json({ success: true, post });
    }
  );

