import { eq, and, desc, sql } from 'drizzle-orm';
import { boards, posts, votes, comments } from '../schema/feedback';

export class FeedbackRepository {
  constructor(private db: any) {}

  async createBoard(params: {
    workspaceId: string;
    name: string;
    slug: string;
    description?: string;
    isPrivate?: boolean;
    allowGuestPosts?: boolean;
  }) {
    const id = 'board_' + Math.random().toString(36).substring(2, 10);
    const [board] = await this.db
      .insert(boards)
      .values({
        id,
        workspaceId: params.workspaceId,
        name: params.name,
        slug: params.slug,
        description: params.description ?? null,
        isPrivate: params.isPrivate ?? false,
        allowGuestPosts: params.allowGuestPosts ?? true,
      })
      .returning();
    return board;
  }

  async getBoardsByWorkspace(workspaceId: string) {
    return this.db
      .select()
      .from(boards)
      .where(eq(boards.workspaceId, workspaceId))
      .orderBy(boards.name);
  }

  async getBoardBySlug(workspaceId: string, slug: string) {
    const [board] = await this.db
      .select()
      .from(boards)
      .where(and(eq(boards.workspaceId, workspaceId), eq(boards.slug, slug)))
      .limit(1);
    return board ?? null;
  }

  async createPost(params: {
    workspaceId: string;
    boardId: string;
    title: string;
    content: string;
    endUserId?: string;
    teamUserId?: string;
  }) {
    const id = 'post_' + Math.random().toString(36).substring(2, 10);
    const [post] = await this.db
      .insert(posts)
      .values({
        id,
        workspaceId: params.workspaceId,
        boardId: params.boardId,
        title: params.title,
        content: params.content,
        endUserId: params.endUserId ?? null,
        teamUserId: params.teamUserId ?? null,
        status: 'pending',
        votesCount: 0,
        commentsCount: 0,
      })
      .returning();
    return post;
  }

  async getPostsByBoard(
    boardId: string,
    options?: { sort?: 'top_voted' | 'newest'; status?: string }
  ) {
    let query = this.db.select().from(posts).where(eq(posts.boardId, boardId));

    if (options?.sort === 'newest') {
      query = query.orderBy(desc(posts.createdAt));
    } else {
      // default: top_voted
      query = query.orderBy(desc(posts.votesCount), desc(posts.createdAt));
    }

    return query;
  }

  async getPostById(postId: string) {
    const [post] = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    return post ?? null;
  }

  async updatePostStatus(postId: string, status: string) {
    const [updated] = await this.db
      .update(posts)
      .set({ status, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning();
    return updated ?? null;
  }

  async toggleVote(params: {
    workspaceId: string;
    postId: string;
    endUserId: string;
  }): Promise<{ voted: boolean; votesCount: number }> {
    return this.db.transaction(async (tx: any) => {
      // Check if user already voted
      const existingVote = await tx.query.votes.findFirst({
        where: and(
          eq(votes.postId, params.postId),
          eq(votes.endUserId, params.endUserId)
        ),
      });

      if (existingVote) {
        // Unvote
        await tx
          .delete(votes)
          .where(
            and(
              eq(votes.postId, params.postId),
              eq(votes.endUserId, params.endUserId)
            )
          );

        const [updatedPost] = await tx
          .update(posts)
          .set({
            votesCount: sql`GREATEST(${posts.votesCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, params.postId))
          .returning();

        return { voted: false, votesCount: updatedPost?.votesCount ?? 0 };
      } else {
        // Vote
        const voteId = 'vote_' + Math.random().toString(36).substring(2, 10);
        await tx
          .insert(votes)
          .values({
            id: voteId,
            workspaceId: params.workspaceId,
            postId: params.postId,
            endUserId: params.endUserId,
          })
          .returning();

        const [updatedPost] = await tx
          .update(posts)
          .set({
            votesCount: sql`${posts.votesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, params.postId))
          .returning();

        return { voted: true, votesCount: updatedPost?.votesCount ?? 1 };
      }
    });
  }

  async createComment(params: {
    workspaceId: string;
    postId: string;
    content: string;
    endUserId?: string;
    teamUserId?: string;
    isInternal?: boolean;
  }) {
    const id = 'comment_' + Math.random().toString(36).substring(2, 10);
    const [comment] = await this.db
      .insert(comments)
      .values({
        id,
        workspaceId: params.workspaceId,
        postId: params.postId,
        content: params.content,
        endUserId: params.endUserId ?? null,
        teamUserId: params.teamUserId ?? null,
        isInternal: params.isInternal ?? false,
      })
      .returning();

    // Increment commentsCount
    await this.db
      .update(posts)
      .set({
        commentsCount: sql`${posts.commentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, params.postId));

    return comment;
  }

  async getCommentsByPost(postId: string, includeInternal: boolean = false) {
    return this.db
      .select()
      .from(comments)
      .where(
        includeInternal
          ? eq(comments.postId, postId)
          : and(eq(comments.postId, postId), eq(comments.isInternal, false))
      )
      .orderBy(comments.createdAt);
  }
}
