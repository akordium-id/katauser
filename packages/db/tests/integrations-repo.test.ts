import { describe, it, expect, vi } from "vitest"
import { IntegrationRepository } from "../src/repositories/integrations"

describe("IntegrationRepository Unit Tests", () => {
  it("creates an integration repository instance", () => {
    const mockDb: any = {}
    const repo = new IntegrationRepository(mockDb)
    expect(repo).toBeDefined()
  })

  it("upserts workspace integration credentials and retrieves them", async () => {
    const mockIntegration = {
      id: "wint_123",
      workspaceId: "ws_demo",
      provider: "linear",
      apiKey: "lin_api_test_123",
      webhookSecret: "whsec_test_456",
      config: { organizationName: "Acme Corp", defaultTeamId: "team_eng" },
      isActive: true,
    }

    const mockReturning = vi.fn().mockResolvedValue([mockIntegration])
    const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockValues = vi
      .fn()
      .mockReturnValue({ onConflictDoUpdate: mockOnConflict })
    const mockDb: any = {
      insert: vi.fn().mockReturnValue({ values: mockValues }),
      query: {
        workspaceIntegrations: {
          findFirst: vi.fn().mockResolvedValue(mockIntegration),
        },
      },
    }

    const repo = new IntegrationRepository(mockDb)
    const result = await repo.upsertWorkspaceIntegration({
      workspaceId: "ws_demo",
      provider: "linear",
      apiKey: "lin_api_test_123",
      webhookSecret: "whsec_test_456",
      config: { organizationName: "Acme Corp", defaultTeamId: "team_eng" },
    })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(result.provider).toBe("linear")
    expect(result.apiKey).toBe("lin_api_test_123")

    const fetched = await repo.getWorkspaceIntegration("ws_demo", "linear")
    expect(fetched?.config).toEqual({
      organizationName: "Acme Corp",
      defaultTeamId: "team_eng",
    })
  })

  it("creates, lists, updates, and deletes post issue links", async () => {
    const mockLink = {
      id: "piss_123",
      workspaceId: "ws_demo",
      postId: "post_1",
      provider: "linear",
      externalIssueId: "lin_issue_uuid_1",
      issueIdentifier: "ENG-142",
      issueUrl: "https://linear.app/acme/issue/ENG-142",
      issueTitle: "CSV Export Support",
      issueStatus: "In Progress",
    }

    const mockReturning = vi.fn().mockResolvedValue([mockLink])
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning })
    const mockWhereUpdate = vi.fn().mockReturnValue({
      returning: vi
        .fn()
        .mockResolvedValue([{ ...mockLink, issueStatus: "Done" }]),
    })
    const mockSet = vi.fn().mockReturnValue({ where: mockWhereUpdate })
    const mockWhereDelete = vi.fn().mockResolvedValue([])

    const mockDb: any = {
      insert: vi.fn().mockReturnValue({ values: mockValues }),
      update: vi.fn().mockReturnValue({ set: mockSet }),
      delete: vi.fn().mockReturnValue({ where: mockWhereDelete }),
      query: {
        postIssues: {
          findMany: vi.fn().mockResolvedValue([mockLink]),
          findFirst: vi.fn().mockResolvedValue(mockLink),
        },
      },
    }

    const repo = new IntegrationRepository(mockDb)
    const created = await repo.createPostIssue({
      workspaceId: "ws_demo",
      postId: "post_1",
      provider: "linear",
      externalIssueId: "lin_issue_uuid_1",
      issueIdentifier: "ENG-142",
      issueUrl: "https://linear.app/acme/issue/ENG-142",
      issueTitle: "CSV Export Support",
      issueStatus: "In Progress",
    })

    expect(created.issueIdentifier).toBe("ENG-142")

    const links = await repo.getPostIssues("post_1")
    expect(links).toHaveLength(1)
    expect(links[0].externalIssueId).toBe("lin_issue_uuid_1")

    const updated = await repo.updatePostIssueStatus("piss_123", "Done")
    expect(updated?.issueStatus).toBe("Done")

    await repo.deletePostIssue("piss_123")
    expect(mockDb.delete).toHaveBeenCalled()
  })
})
