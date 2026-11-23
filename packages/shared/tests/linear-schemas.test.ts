import { describe, it, expect } from "vitest"
import {
  saveLinearIntegrationSchema,
  createLinearIssueSchema,
  linkLinearIssueSchema,
} from "../src/schemas/integrations"

describe("Linear Schemas", () => {
  it("should validate saveLinearIntegrationSchema", () => {
    const valid = saveLinearIntegrationSchema.safeParse({
      apiKey: "lin_api_valid_token",
      webhookSecret: "whsec_valid_secret",
      defaultTeamId: "team_1",
    })
    expect(valid.success).toBe(true)

    const invalid = saveLinearIntegrationSchema.safeParse({ apiKey: "" })
    expect(invalid.success).toBe(false)
  })

  it("should validate createLinearIssueSchema", () => {
    const valid = createLinearIssueSchema.safeParse({
      postId: "p_1",
      teamId: "t_1",
      title: "Add dark mode to widget",
      priority: 2,
    })
    expect(valid.success).toBe(true)

    const invalid = createLinearIssueSchema.safeParse({
      postId: "",
      teamId: "",
      title: "",
    })
    expect(invalid.success).toBe(false)
  })

  it("should validate linkLinearIssueSchema", () => {
    const valid = linkLinearIssueSchema.safeParse({
      postId: "p_1",
      issueIdOrKey: "ENG-142",
    })
    expect(valid.success).toBe(true)

    const invalid = linkLinearIssueSchema.safeParse({
      postId: "p_1",
      issueIdOrKey: "",
    })
    expect(invalid.success).toBe(false)
  })
})
