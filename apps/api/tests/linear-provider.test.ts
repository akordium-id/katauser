import { describe, it, expect, vi, beforeEach } from "vitest"
import { LinearProvider } from "../src/modules/integrations/providers/linear.provider"

describe("LinearProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("should successfully test connection and return organization name", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          viewer: {
            id: "user_1",
            name: "John Doe",
            organization: { name: "Acme Software" },
          },
        },
      }),
    })

    const provider = new LinearProvider()
    const result = await provider.testConnection("lin_api_valid")

    expect(result.success).toBe(true)
    expect(result.organizationName).toBe("Acme Software")
  })

  it("should handle invalid API key during test connection", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        errors: [{ message: "Authentication failed" }],
      }),
    })

    const provider = new LinearProvider()
    const result = await provider.testConnection("lin_api_invalid")

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it("should list teams for workspace", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          teams: {
            nodes: [
              { id: "team_eng", name: "Engineering", key: "ENG" },
              { id: "team_prod", name: "Product", key: "PROD" },
            ],
          },
        },
      }),
    })

    const provider = new LinearProvider()
    const teams = await provider.listTeams("lin_api_valid")

    expect(teams).toHaveLength(2)
    expect(teams[0].key).toBe("ENG")
  })

  it("should create issue with backlink footer", async () => {
    let capturedBody: any = null
    global.fetch = vi.fn().mockImplementation(async (_url, options) => {
      capturedBody = JSON.parse(options.body)
      return {
        ok: true,
        json: async () => ({
          data: {
            issueCreate: {
              success: true,
              issue: {
                id: "lin_uuid_99",
                identifier: "ENG-99",
                title: "Export to CSV",
                url: "https://linear.app/acme/issue/ENG-99",
                state: { name: "Todo", type: "unstarted" },
              },
            },
          },
        }),
      }
    })

    const provider = new LinearProvider()
    const issue = await provider.createIssue("lin_api_valid", {
      teamId: "team_eng",
      title: "Export to CSV",
      description: "Allow users to download CSV",
      postUrl: "https://katauser.com/dashboard/acme/posts/p_1",
    })

    expect(issue.identifier).toBe("ENG-99")
    expect(issue.status).toBe("Todo")
    expect(capturedBody.variables.input.description).toContain(
      "https://katauser.com/dashboard/acme/posts/p_1",
    )
  })

  it("should get issue by id or identifier", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          issue: {
            id: "lin_uuid_142",
            identifier: "ENG-142",
            title: "Dark mode support",
            url: "https://linear.app/acme/issue/ENG-142",
            state: { name: "In Progress", type: "started" },
          },
        },
      }),
    })

    const provider = new LinearProvider()
    const issue = await provider.getIssue("lin_api_valid", "ENG-142")

    expect(issue.identifier).toBe("ENG-142")
    expect(issue.status).toBe("In Progress")
    expect(issue.stateType).toBe("started")
  })
})
