import { describe, it, expect, vi } from "vitest"
import { FeedbackRepository } from "../src/repositories/feedback"

describe("FeedbackRepository Unit Tests", () => {
  it("creates a repository instance", () => {
    const mockDb: any = {}
    const repo = new FeedbackRepository(mockDb)
    expect(repo).toBeDefined()
  })

  it("calls db.insert when creating a board", async () => {
    const mockReturning = vi.fn().mockResolvedValue([
      {
        id: "b_123",
        name: "Features",
        slug: "features",
        workspaceId: "ws_1",
      },
    ])
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockDb: any = {
      insert: vi.fn().mockReturnValue({ values: mockValues }),
    }

    const repo = new FeedbackRepository(mockDb)
    const result = await repo.createBoard({
      workspaceId: "ws_1",
      name: "Features",
      slug: "features",
    })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(result.id).toBe("b_123")
    expect(result.slug).toBe("features")
  })

  it("calls db.insert when creating a post", async () => {
    const mockReturning = vi
      .fn()
      .mockResolvedValue([{ id: "p_123", title: "Dark Mode", votesCount: 0 }])
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockDb: any = {
      insert: vi.fn().mockReturnValue({ values: mockValues }),
    }

    const repo = new FeedbackRepository(mockDb)
    const result = await repo.createPost({
      workspaceId: "ws_1",
      boardId: "b_1",
      title: "Dark Mode",
      content: "Add dark mode please",
    })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(result.id).toBe("p_123")
    expect(result.title).toBe("Dark Mode")
  })

  it("handles toggleVote with atomic increment when not yet voted", async () => {
    // If not voted, insert vote & increment post votesCount
    const mockTx: any = {
      query: {
        votes: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "v_1" }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "p_1", votesCount: 1 }]),
          }),
        }),
      }),
    }

    const mockDb: any = {
      transaction: vi
        .fn()
        .mockImplementation(async (callback) => callback(mockTx)),
    }

    const repo = new FeedbackRepository(mockDb)
    const result = await repo.toggleVote({
      workspaceId: "ws_1",
      postId: "p_1",
      endUserId: "usr_1",
    })

    expect(result.voted).toBe(true)
    expect(result.votesCount).toBe(1)
    expect(mockTx.insert).toHaveBeenCalled()
  })

  it("handles toggleVote with atomic decrement when already voted", async () => {
    // If already voted, delete vote & decrement post votesCount
    const mockTx: any = {
      query: {
        votes: {
          findFirst: vi.fn().mockResolvedValue({ id: "v_existing" }),
        },
      },
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: "p_1", votesCount: 0 }]),
          }),
        }),
      }),
    }

    const mockDb: any = {
      transaction: vi
        .fn()
        .mockImplementation(async (callback) => callback(mockTx)),
    }

    const repo = new FeedbackRepository(mockDb)
    const result = await repo.toggleVote({
      workspaceId: "ws_1",
      postId: "p_1",
      endUserId: "usr_1",
    })

    expect(result.voted).toBe(false)
    expect(result.votesCount).toBe(0)
    expect(mockTx.delete).toHaveBeenCalled()
  })
})
