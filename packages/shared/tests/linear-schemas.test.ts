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

  it("should validate linkLinearIssueSchema and reject non-identifier formats", () => {
    const validKey = linkLinearIssueSchema.safeParse({
      postId: "p_1",
      issueIdOrKey: "ENG-142",
    })
    expect(validKey.success).toBe(true)

    const validUuid = linkLinearIssueSchema.safeParse({
      postId: "p_1",
      issueIdOrKey: "e067c295-8120-410a-8d1b-10f81d1e4c73",
    })
    expect(validUuid.success).toBe(true)

    const invalidEmpty = linkLinearIssueSchema.safeParse({
      postId: "p_1",
      issueIdOrKey: "",
    })
    expect(invalidEmpty.success).toBe(false)

    const invalidFormat = linkLinearIssueSchema.safeParse({
      postId: "p_1",
      issueIdOrKey: "invalid format with spaces",
    })
    expect(invalidFormat.success).toBe(false)
  })
})
