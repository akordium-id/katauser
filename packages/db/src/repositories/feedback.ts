import { eq, and, desc, sql } from "drizzle-orm"
import { boards, posts, votes, comments } from "../schema/feedback"
import { endUsers } from "../schema/workspaces"

export class FeedbackRepository {
  constructor(private db: any) {}

  async createBoard(params: {
    workspaceId: string
    name: string
    slug: string
    description?: string
    isPrivate?: boolean
    allowGuestPosts?: boolean
  }) {
    const id = "board_" + Math.random().toString(36).substring(2, 10)
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
      .returning()
    return board
  }

  async getBoardsByWorkspace(workspaceId: string) {
    return this.db
      .select()
      .from(boards)
      .where(eq(boards.workspaceId, workspaceId))
      .orderBy(boards.name)
  }

  async getBoardBySlug(workspaceId: string, slug: string) {
    const [board] = await this.db
      .select()
      .from(boards)
      .where(and(eq(boards.workspaceId, workspaceId), eq(boards.slug, slug)))
      .limit(1)
    return board ?? null
  }

  async createPost(params: {
    workspaceId: string
    boardId: string
    title: string
    content: string
    endUserId?: string
    teamUserId?: string
  }) {
    const id = "post_" + Math.random().toString(36).substring(2, 10)
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
        status: "pending",
        votesCount: 0,
        commentsCount: 0,
      })
      .returning()
    return post
  }

  async getPostsByBoard(
    boardId: string,
    options?: { sort?: "top_voted" | "newest"; status?: string },
  ) {
    let query = this.db.select().from(posts).where(eq(posts.boardId, boardId))

    if (options?.sort === "newest") {
      query = query.orderBy(desc(posts.createdAt))
    } else {
      // default: top_voted
      query = query.orderBy(desc(posts.votesCount), desc(posts.createdAt))
    }

    return query
  }

  async getPostById(postId: string) {
    const [post] = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)
    return post ?? null
  }

  async updatePostStatus(postId: string, status: string) {
    const [updated] = await this.db
      .update(posts)
      .set({ status, updatedAt: new Date() })
      .where(eq(posts.id, postId))
      .returning()
    return updated ?? null
  }

  async toggleVote(params: {
    workspaceId: string
    postId: string
    endUserId: string
  }): Promise<{ voted: boolean; votesCount: number }> {
    return this.db.transaction(async (tx: any) => {
      // Check if user already voted
      const existingVote = await tx.query.votes.findFirst({
        where: and(
          eq(votes.postId, params.postId),
          eq(votes.endUserId, params.endUserId),
        ),
      })

      if (existingVote) {
        // Unvote
        await tx
          .delete(votes)
          .where(
            and(
              eq(votes.postId, params.postId),
              eq(votes.endUserId, params.endUserId),
            ),
          )

        const [updatedPost] = await tx
          .update(posts)
          .set({
            votesCount: sql`GREATEST(${posts.votesCount} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, params.postId))
          .returning()

        return { voted: false, votesCount: updatedPost?.votesCount ?? 0 }
      } else {
        // Vote
        const voteId = "vote_" + Math.random().toString(36).substring(2, 10)
        await tx
          .insert(votes)
          .values({
            id: voteId,
            workspaceId: params.workspaceId,
            postId: params.postId,
            endUserId: params.endUserId,
          })
          .returning()

        const [updatedPost] = await tx
          .update(posts)
          .set({
            votesCount: sql`${posts.votesCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(posts.id, params.postId))
          .returning()

        return { voted: true, votesCount: updatedPost?.votesCount ?? 1 }
      }
    })
  }

  async createComment(params: {
    workspaceId: string
    postId: string
    content: string
    endUserId?: string
    teamUserId?: string
    isInternal?: boolean
  }) {
    const id = "comment_" + Math.random().toString(36).substring(2, 10)
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
      .returning()

    // Increment commentsCount
    await this.db
      .update(posts)
      .set({
        commentsCount: sql`${posts.commentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, params.postId))

    return comment
  }

  async getCommentsByPost(postId: string, includeInternal: boolean = false) {
    return this.db
      .select()
      .from(comments)
      .where(
        includeInternal
          ? eq(comments.postId, postId)
          : and(eq(comments.postId, postId), eq(comments.isInternal, false)),
      )
      .orderBy(comments.createdAt)
  }

  async mergePosts(params: {
    workspaceId: string
    sourcePostId: string
    targetPostId: string
  }): Promise<{ success: boolean; transferredVotesCount: number }> {
    if (params.sourcePostId === params.targetPostId) {
      throw new Error("Cannot merge post into itself")
    }

    return this.db.transaction(async (tx: any) => {
      // 1. Fetch target post
      const targetPost = await tx.query.posts.findFirst({
        where: and(
          eq(posts.id, params.targetPostId),
          eq(posts.workspaceId, params.workspaceId),
        ),
      })
      if (!targetPost) {
        throw new Error("Target post not found")
      }
      if (targetPost.status === "merged" || targetPost.mergedIntoPostId) {
        throw new Error("Target post is already merged")
      }

      // 2. Fetch source post
      const sourcePost = await tx.query.posts.findFirst({
        where: and(
          eq(posts.id, params.sourcePostId),
          eq(posts.workspaceId, params.workspaceId),
        ),
      })
      if (!sourcePost) {
        throw new Error("Source post not found")
      }
      if (sourcePost.status === "merged" || sourcePost.mergedIntoPostId) {
        throw new Error("Source post is already merged")
      }

      // 3. Fetch votes from both posts
      const sourceVotes = await tx.query.votes.findMany({
        where: eq(votes.postId, params.sourcePostId),
      })
      const targetVotes = await tx.query.votes.findMany({
        where: eq(votes.postId, params.targetPostId),
      })

      const targetEndUserIds = new Set(
        targetVotes.map((v: any) => v.endUserId),
      )
      let transferredVotesCount = 0

      for (const sVote of sourceVotes) {
        if (targetEndUserIds.has(sVote.endUserId)) {
          // Duplicate vote on target post: delete duplicate from source post
          await tx.delete(votes).where(eq(votes.id, sVote.id))
        } else {
          // Reassign vote to target post
          await tx
            .update(votes)
            .set({ postId: params.targetPostId })
            .where(eq(votes.id, sVote.id))
          targetEndUserIds.add(sVote.endUserId)
          transferredVotesCount++
        }
      }

      // 4. Update target post counters (votes and comments for internal audit note)
      await tx
        .update(posts)
        .set({
          votesCount: sql`${posts.votesCount} + ${transferredVotesCount}`,
          commentsCount: sql`${posts.commentsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, params.targetPostId))

      // 5. Update source post: status merged & mergedIntoPostId
      await tx
        .update(posts)
        .set({
          status: "merged",
          mergedIntoPostId: params.targetPostId,
          votesCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, params.sourcePostId))

      // 6. Update transitive pointers for posts previously merged into sourcePost
      await tx
        .update(posts)
        .set({
          mergedIntoPostId: params.targetPostId,
          updatedAt: new Date(),
        })
        .where(eq(posts.mergedIntoPostId, params.sourcePostId))

      // 7. Insert internal audit comment on target post
      const commentId =
        "comment_" + Math.random().toString(36).substring(2, 10)
      await tx.insert(comments).values({
        id: commentId,
        workspaceId: params.workspaceId,
        postId: params.targetPostId,
        content: `Post "${sourcePost.title}" was merged into this post with ${transferredVotesCount} voters.`,
        isInternal: true,
      })

      return { success: true, transferredVotesCount }
    })
  }

  async voteOnBehalf(params: {
    workspaceId: string
    postId: string
    teamUserId: string
    customerEmail: string
    customerName?: string
    company?: string
    mrr?: number
    internalNote?: string
  }): Promise<{ success: boolean; voteId: string }> {
    const normalizedEmail = params.customerEmail.trim().toLowerCase()

    return this.db.transaction(async (tx: any) => {
      // 1. Verify target post exists and is not merged
      const targetPost = await tx.query.posts.findFirst({
        where: and(
          eq(posts.id, params.postId),
          eq(posts.workspaceId, params.workspaceId),
        ),
      })
      if (!targetPost) {
        throw new Error("Post not found")
      }
      if (targetPost.status === "merged" || targetPost.mergedIntoPostId) {
        throw new Error("Cannot vote on a merged post")
      }

      // 2. Find or create endUser
      let endUser = await tx.query.endUsers.findFirst({
        where: and(
          eq(endUsers.workspaceId, params.workspaceId),
          eq(endUsers.email, normalizedEmail),
        ),
      })

      if (!endUser) {
        const newEndUserId =
          "enduser_" + Math.random().toString(36).substring(2, 10)
        const [created] = await tx
          .insert(endUsers)
          .values({
            id: newEndUserId,
            workspaceId: params.workspaceId,
            email: normalizedEmail,
            name: params.customerName ?? null,
            metadata: {
              company: params.company ?? undefined,
              mrr: params.mrr ?? undefined,
            },
          })
          .returning()
        endUser = created ?? { id: newEndUserId }
      }

      // 3. Check if customer already voted
      const existingVote = await tx.query.votes.findFirst({
        where: and(
          eq(votes.postId, params.postId),
          eq(votes.endUserId, endUser.id),
        ),
      })
      if (existingVote) {
        throw new Error("Customer has already voted on this post")
      }

      // 4. Insert vote with staff attribution and note
      const voteId = "vote_" + Math.random().toString(36).substring(2, 10)
      await tx.insert(votes).values({
        id: voteId,
        workspaceId: params.workspaceId,
        postId: params.postId,
        endUserId: endUser.id,
        votedByTeamUserId: params.teamUserId,
        internalNote: params.internalNote ?? null,
      })

      // 4. Increment post votesCount
      await tx
        .update(posts)
        .set({
          votesCount: sql`${posts.votesCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, params.postId))

      return { success: true, voteId }
    })
  }
}
