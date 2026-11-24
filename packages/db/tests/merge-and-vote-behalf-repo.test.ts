import { describe, it, expect, vi } from "vitest"
import { FeedbackRepository } from "../src/repositories/feedback"

describe("FeedbackRepository - Merge Posts & Vote on Behalf", () => {
  it("rejects self-merge with error", async () => {
    const mockDb: any = {
      transaction: vi.fn(),
    }
    const repo = new FeedbackRepository(mockDb)

    await expect(
      repo.mergePosts({
        workspaceId: "ws_1",
        sourcePostId: "post_target",
        targetPostId: "post_target",
      }),
    ).rejects.toThrow("Cannot merge post into itself")
  })

  it("rejects merge if target post is already merged", async () => {
    const mockTx: any = {
      query: {
        posts: {
          findFirst: vi.fn().mockImplementation(({ where }: any) => {
            return Promise.resolve({
              id: "post_target",
              workspaceId: "ws_1",
              status: "merged",
              mergedIntoPostId: "post_root",
            })
          }),
        },
      },
    }
    const mockDb: any = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    }
    const repo = new FeedbackRepository(mockDb)

    await expect(
      repo.mergePosts({
        workspaceId: "ws_1",
        sourcePostId: "post_source",
        targetPostId: "post_target",
      }),
    ).rejects.toThrow("Target post is already merged")
  })

  it("merges posts, deduplicates voters, updates status and inserts internal note comment", async () => {
    const sourcePost = {
      id: "post_source",
      workspaceId: "ws_1",
      title: "Night theme",
      status: "pending",
      votesCount: 2,
      mergedIntoPostId: null,
    }
    const targetPost = {
      id: "post_target",
      workspaceId: "ws_1",
      title: "Dark Mode",
      status: "planned",
      votesCount: 3,
      mergedIntoPostId: null,
    }

    const sourceVotes = [
      { id: "v1", postId: "post_source", endUserId: "user_a" },
      { id: "v2", postId: "post_source", endUserId: "user_b" }, // user_b already voted on target
    ]

    const targetVotes = [
      { id: "v3", postId: "post_target", endUserId: "user_b" },
      { id: "v4", postId: "post_target", endUserId: "user_c" },
      { id: "v5", postId: "post_target", endUserId: "user_d" },
    ]

    let findFirstCount = 0
    let findManyCount = 0

    const mockTx: any = {
      query: {
        posts: {
          findFirst: vi.fn().mockImplementation(() => {
            findFirstCount++
            if (findFirstCount === 1) return Promise.resolve(targetPost)
            if (findFirstCount === 2) return Promise.resolve(sourcePost)
            return Promise.resolve(null)
          }),
        },
        votes: {
          findMany: vi.fn().mockImplementation(() => {
            findManyCount++
            if (findManyCount === 1) return Promise.resolve(sourceVotes)
            if (findManyCount === 2) return Promise.resolve(targetVotes)
            return Promise.resolve([])
          }),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "updated" }]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "new_comm" }]),
        }),
      }),
    }

    const mockDb: any = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    }

    const repo = new FeedbackRepository(mockDb)
    const result = await repo.mergePosts({
      workspaceId: "ws_1",
      sourcePostId: "post_source",
      targetPostId: "post_target",
    })

    expect(result.success).toBe(true)
    expect(result.transferredVotesCount).toBe(1) // Only user_a transferred, user_b was duplicate
    expect(mockTx.update).toHaveBeenCalled()
    expect(mockTx.insert).toHaveBeenCalled() // Comment added
  })

  it("voteOnBehalf rejects if post is not found", async () => {
    const mockTx: any = {
      query: {
        posts: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    }
    const mockDb: any = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    }
    const repo = new FeedbackRepository(mockDb)

    await expect(
      repo.voteOnBehalf({
        workspaceId: "ws_1",
        postId: "missing_post",
        teamUserId: "staff_1",
        customerEmail: "cust@corp.com",
      }),
    ).rejects.toThrow("Post not found")
  })

  it("voteOnBehalf rejects if post is already merged", async () => {
    const mockTx: any = {
      query: {
        posts: {
          findFirst: vi.fn().mockResolvedValue({
            id: "merged_post",
            status: "merged",
            mergedIntoPostId: "target_post",
          }),
        },
      },
    }
    const mockDb: any = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    }
    const repo = new FeedbackRepository(mockDb)

    await expect(
      repo.voteOnBehalf({
        workspaceId: "ws_1",
        postId: "merged_post",
        teamUserId: "staff_1",
        customerEmail: "cust@corp.com",
      }),
    ).rejects.toThrow("Cannot vote on a merged post")
  })

  it("voteOnBehalf rejects if customer already voted", async () => {
    const mockTx: any = {
      query: {
        posts: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: "post_1", status: "planned" }),
        },
        endUsers: {
          findFirst: vi.fn().mockResolvedValue({ id: "user_cust_1" }),
        },
        votes: {
          findFirst: vi.fn().mockResolvedValue({ id: "existing_vote" }),
        },
      },
    }
    const mockDb: any = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    }
    const repo = new FeedbackRepository(mockDb)

    await expect(
      repo.voteOnBehalf({
        workspaceId: "ws_1",
        postId: "post_1",
        teamUserId: "staff_1",
        customerEmail: "cust@corp.com",
      }),
    ).rejects.toThrow("Customer has already voted on this post")
  })

  it("voteOnBehalf creates endUser if new, inserts vote with staff attribution, and increments votes", async () => {
    const mockTx: any = {
      query: {
        posts: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: "post_1", status: "planned" }),
        },
        endUsers: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        votes: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "new_id" }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "post_1", votesCount: 5 }]),
          }),
        }),
      }),
    }
    const mockDb: any = {
      transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    }
    const repo = new FeedbackRepository(mockDb)

    const result = await repo.voteOnBehalf({
      workspaceId: "ws_1",
      postId: "post_1",
      teamUserId: "staff_1",
      customerEmail: "new@corp.com",
      customerName: "New Customer",
      company: "Corp A",
      mrr: 1000,
      internalNote: "Sales call renewal",
    })

    expect(result.success).toBe(true)
    expect(result.voteId).toBeDefined()
    expect(mockTx.insert).toHaveBeenCalled()
    expect(mockTx.update).toHaveBeenCalled()
  })
})
