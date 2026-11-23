import {
  boardsStore,
} from "../feedback/boards.route"
import {
  postsStore,
  votesStore,
  commentsStore,
} from "../feedback/posts.route"
import { changelogsStore } from "../changelog/changelog.route"
import { postIssuesStore } from "../integrations/linear.route"
import { sendVoterNotificationEmail } from "../../services/email-notifier"
import { getWorkspaceWebhookConfig } from "../integrations/integrations.route"
import { dispatchWebhookEvent } from "../integrations/webhook-dispatcher"
import type {
  ListFeedbackMcpInput,
  GetFeedbackDetailsMcpInput,
  CreateFeedbackMcpInput,
  UpdatePostStatusMcpInput,
  CreateChangelogReleaseMcpInput,
} from "@katauser/shared"

export class McpService {
  constructor(private workspaceId: string) {}

  private getWorkspaceBoardIds(): string[] {
    return boardsStore
      .filter((b) => b.workspaceId === this.workspaceId)
      .map((b) => b.id)
  }

  async listFeedback(input: ListFeedbackMcpInput) {
    const boards = boardsStore.filter((b) => b.workspaceId === this.workspaceId)
    let targetBoardIds = boards.map((b) => b.id)

    if (input.boardSlug) {
      const matched = boards.find((b) => b.slug === input.boardSlug)
      if (!matched) {
        return { success: true, posts: [] }
      }
      targetBoardIds = [matched.id]
    }

    let posts = postsStore.filter((p) => targetBoardIds.includes(p.boardId))

    if (input.status && input.status !== "all") {
      posts = posts.filter((p) => p.status === input.status)
    }

    // Sorting
    if (input.sortBy === "mrr") {
      posts.sort((a, b) => (b.totalMrr || 0) - (a.totalMrr || 0))
    } else if (input.sortBy === "recent") {
      posts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    } else {
      // popular (default)
      posts.sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0))
    }

    const limit = input.limit ?? 10
    const sliced = posts.slice(0, limit).map((p) => {
      const board = boards.find((b) => b.id === p.boardId)
      return {
        id: p.id,
        title: p.title,
        content: p.content,
        status: p.status,
        votesCount: p.votesCount,
        totalMrr: p.totalMrr || 0,
        boardName: board?.name || "Feedback",
        createdAt: p.createdAt,
      }
    })

    return { success: true, posts: sliced }
  }

  async getFeedbackDetails(input: GetFeedbackDetailsMcpInput) {
    const boardIds = this.getWorkspaceBoardIds()
    const post = postsStore.find(
      (p) => p.id === input.postId && boardIds.includes(p.boardId),
    )

    if (!post) {
      return { success: false, message: "Post not found or unauthorized", post: null }
    }

    const board = boardsStore.find((b) => b.id === post.boardId)
    const voters = votesStore
      .filter((v) => v.postId === post.id)
      .map((v) => ({
        userId: v.userId,
        email: v.userEmail || "",
        company: v.traits?.company,
        mrr: v.traits?.mrr || 0,
      }))

    const comments = commentsStore
      .filter((c) => c.postId === post.id)
      .map((c) => ({
        id: c.id,
        content: c.content,
        isInternal: c.isInternal,
        createdAt: c.createdAt,
      }))

    const linkedIssues = postIssuesStore
      .filter((pi) => pi.postId === post.id)
      .map((pi) => ({
        provider: pi.provider,
        issueId: pi.externalIssueId,
        issueIdentifier: pi.issueIdentifier,
        issueUrl: pi.issueUrl,
        status: pi.issueStatus,
      }))

    return {
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        votesCount: post.votesCount,
        totalMrr: post.totalMrr || 0,
        board: board ? { id: board.id, name: board.name, slug: board.slug } : null,
        voters,
        comments,
        linkedIssues,
        createdAt: post.createdAt,
      },
    }
  }

  async createFeedback(input: CreateFeedbackMcpInput) {
    const boards = boardsStore.filter((b) => b.workspaceId === this.workspaceId)
    let targetBoard = boards[0]

    if (input.boardSlug) {
      const found = boards.find((b) => b.slug === input.boardSlug)
      if (!found) {
        return {
          success: false,
          message: `Board with slug '${input.boardSlug}' not found in workspace`,
          post: null,
        }
      }
      targetBoard = found
    }

    if (!targetBoard) {
      // Auto-create default board if not exists
      targetBoard = {
        id: "board_" + Math.random().toString(36).substring(2, 10),
        workspaceId: this.workspaceId,
        name: "General Feedback",
        slug: "general",
        description: null,
        isPrivate: false,
        allowGuestPosts: true,
        createdAt: new Date().toISOString(),
      }
      boardsStore.push(targetBoard)
    }

    const newPostId = "p_" + Math.random().toString(36).substring(2, 10)
    let initialMrr = 0
    let initialVotes = 0

    if (input.customerEmail) {
      initialVotes = 1
      initialMrr = input.customerMrr || 0
      votesStore.push({
        postId: newPostId,
        userId: "cust_" + Math.random().toString(36).substring(2, 8),
        userEmail: input.customerEmail,
        traits: {
          company: input.customerCompany,
          mrr: input.customerMrr || 0,
        },
      })
    }

    const newPost = {
      id: newPostId,
      boardId: targetBoard.id,
      title: input.title,
      content: input.content,
      status: "open",
      votesCount: initialVotes,
      totalMrr: initialMrr,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    }

    postsStore.push(newPost)

    return {
      success: true,
      post: {
        id: newPost.id,
        title: newPost.title,
        status: newPost.status,
        votesCount: newPost.votesCount,
        totalMrr: newPost.totalMrr,
        boardId: targetBoard.id,
        createdAt: newPost.createdAt,
      },
    }
  }

  async updatePostStatus(input: UpdatePostStatusMcpInput) {
    const boardIds = this.getWorkspaceBoardIds()
    const post = postsStore.find(
      (p) => p.id === input.postId && boardIds.includes(p.boardId),
    )

    if (!post) {
      return { success: false, message: "Post not found or unauthorized", post: null }
    }

    const oldStatus = post.status
    post.status = input.status

    let notifiedCount = 0
    if (input.status === "completed" && oldStatus !== "completed" && input.notifyVoters) {
      const voters = votesStore
        .filter((v) => v.postId === post.id)
        .map((v) => v.userEmail)
        .filter((e): e is string => Boolean(e))

      const uniqueEmails = Array.from(new Set(voters))
      notifiedCount = uniqueEmails.length

      for (const email of uniqueEmails) {
        await sendVoterNotificationEmail({
          recipientEmail: email,
          workspaceName: this.workspaceId,
          postTitle: post.title,
          newStatus: "shipped",
          postUrl: `/p/${post.id}`,
        }).catch(() => {})
      }

      // Dispatch webhook
      const webhookConfig = getWorkspaceWebhookConfig(this.workspaceId)
      if (webhookConfig) {
        await dispatchWebhookEvent(webhookConfig, {
          event: "post.voted" as any,
          workspaceSlug: this.workspaceId,
          timestamp: new Date().toISOString(),
          data: {
            title: post.title,
            content: post.content,
            votesCount: post.votesCount,
            mrrImpact: post.totalMrr,
            url: `/p/${post.id}`,
          },
        }).catch(() => {})
      }
    }

    return {
      success: true,
      post: {
        id: post.id,
        title: post.title,
        status: post.status,
      },
      notifiedVotersCount: notifiedCount,
    }
  }

  async getRoadmapKanban() {
    const boardIds = this.getWorkspaceBoardIds()
    const posts = postsStore.filter((p) => boardIds.includes(p.boardId))

    const planned = posts.filter((p) => p.status === "planned")
    const inProgress = posts.filter((p) => p.status === "in_progress")
    const completed = posts.filter((p) => p.status === "completed")

    return {
      success: true,
      roadmap: {
        planned,
        inProgress,
        completed,
      },
    }
  }

  async createChangelogRelease(input: CreateChangelogReleaseMcpInput) {
    if (input.postIds && input.postIds.length > 0) {
      const allowedBoardIds = this.getWorkspaceBoardIds()
      const validPosts = postsStore.filter(
        (p) =>
          allowedBoardIds.includes(p.boardId) && input.postIds!.includes(p.id),
      )
      if (validPosts.length !== input.postIds.length) {
        return {
          success: false,
          message:
            "Invalid postIds: One or more posts do not exist or belong to another workspace",
          changelog: null,
        }
      }
    }

    const newChangelog = {
      id: "ch_" + Math.random().toString(36).substring(2, 10),
      workspaceId: this.workspaceId,
      version: input.version,
      title: input.title,
      slug: input.version.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      content: input.content,
      postIds: input.postIds || [],
      publishedAt: input.publishedAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    changelogsStore.push(newChangelog)

    return {
      success: true,
      changelog: newChangelog,
    }
  }
}
