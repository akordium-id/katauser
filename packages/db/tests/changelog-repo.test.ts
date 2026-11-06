import { describe, it, expect, vi } from "vitest"
import { ChangelogRepository } from "../src/repositories/changelog"

describe("ChangelogRepository Unit Tests", () => {
  it("creates a changelog repository instance", () => {
    const mockDb: any = {}
    const repo = new ChangelogRepository(mockDb)
    expect(repo).toBeDefined()
  })

  it("creates changelog and links postIds in transaction", async () => {
    const mockTx: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([
              { id: "ch_1", title: "v1.0.0", slug: "v1-0-0" },
            ]),
        }),
      }),
    }

    const mockDb: any = {
      transaction: vi
        .fn()
        .mockImplementation(async (callback) => callback(mockTx)),
    }

    const repo = new ChangelogRepository(mockDb)
    const result = await repo.createChangelog({
      workspaceId: "ws_1",
      title: "v1.0.0",
      slug: "v1-0-0",
      content: "Initial release",
      postIds: ["p_1", "p_2"],
    })

    expect(result.id).toBe("ch_1")
    expect(mockTx.insert).toHaveBeenCalledTimes(2) // once for changelog, once for changelog_posts
  })

  it("groups posts for roadmap kanban correctly", async () => {
    const mockPosts = [
      { id: "p_1", title: "Feature A", status: "planned" },
      { id: "p_2", title: "Feature B", status: "in_progress" },
      { id: "p_3", title: "Feature C", status: "completed" },
      { id: "p_4", title: "Feature D", status: "closed" },
    ]

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPosts),
          }),
        }),
      }),
    }

    const repo = new ChangelogRepository(mockDb)
    const roadmap = await repo.getRoadmapGroupedPosts("ws_1")

    expect(roadmap.planned).toHaveLength(1)
    expect(roadmap.inProgress).toHaveLength(1)
    expect(roadmap.completed).toHaveLength(1)
    expect(roadmap.planned[0].id).toBe("p_1")
  })

  it("retrieves and deduplicates voter emails for given postIds", async () => {
    const mockVotes = [
      { email: "alice@example.com" },
      { email: "bob@example.com" },
      { email: "alice@example.com" }, // duplicate voter across posts
    ]

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockVotes),
          }),
        }),
      }),
    }

    const repo = new ChangelogRepository(mockDb)
    const emails = await repo.getVoterEmailsForPosts(["p_1", "p_2"])

    expect(emails).toEqual(["alice@example.com", "bob@example.com"])
  })
})
