import { describe, it, expect } from "vitest"
import { createWorkspaceSchema } from "../src/schemas/workspace"
import { WorkspaceRole } from "../src/constants/roles"

describe("Workspace Schema Validation", () => {
  it("validates a valid workspace creation payload", () => {
    const validData = {
      name: "Acme SaaS",
      slug: "acme-saas",
      customDomain: "feedback.acme.com",
    }
    const parsed = createWorkspaceSchema.parse(validData)
    expect(parsed.name).toBe("Acme SaaS")
    expect(parsed.slug).toBe("acme-saas")
    expect(parsed.customDomain).toBe("feedback.acme.com")
  })

  it("rejects invalid slugs (uppercase, spaces, special chars)", () => {
    const invalidData = {
      name: "Acme SaaS",
      slug: "Acme Space!",
    }
    expect(() => createWorkspaceSchema.parse(invalidData)).toThrow()
  })

  it("rejects reserved subdomains as slugs", () => {
    const reservedData = {
      name: "Admin Area",
      slug: "api",
    }
    expect(() => createWorkspaceSchema.parse(reservedData)).toThrow(/reserved/i)
  })
})

describe("Workspace Roles", () => {
  it("defines the correct role hierarchy", () => {
    expect(WorkspaceRole.OWNER).toBe("owner")
    expect(WorkspaceRole.ADMIN).toBe("admin")
    expect(WorkspaceRole.MEMBER).toBe("member")
  })
})
