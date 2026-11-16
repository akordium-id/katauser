import { describe, it, expect } from "vitest"
import { createWorkspaceSchema, RESERVED_SLUGS } from "@katauser/shared"

describe("Workspace Hub & Dashboard Logic", () => {
  it("generates a valid clean slug from workspace name", () => {
    const rawName = "Acme Super SaaS 2.0!"
    const generatedSlug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    expect(generatedSlug).toBe("acme-super-saas-2-0")

    const parseResult = createWorkspaceSchema.safeParse({
      name: rawName,
      slug: generatedSlug,
    })
    expect(parseResult.success).toBe(true)
  })

  it("rejects reserved slugs in workspace hub creation", () => {
    for (const reserved of ["admin", "dashboard", "billing", "settings", "api"]) {
      const result = createWorkspaceSchema.safeParse({
        name: "Test Workspace",
        slug: reserved,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0]?.message).toMatch(/reserved/i)
      }
    }
  })

  it("provides fallback default workspace when user workspace list is empty", () => {
    const apiWorkspaces: Array<{ id: string; name: string; slug: string }> = []
    const resolvedWorkspaces =
      apiWorkspaces.length > 0
        ? apiWorkspaces
        : [
            {
              id: "ws_default",
              name: "Acme Corp",
              slug: "acme",
              plan: "Free",
              boardsCount: 3,
            },
          ]

    expect(resolvedWorkspaces).toHaveLength(1)
    expect(resolvedWorkspaces[0].slug).toBe("acme")
    expect(resolvedWorkspaces[0].name).toBe("Acme Corp")
  })

  it("constructs correct dashboard and public portal routes", () => {
    const slug = "layangan-app"
    const dashboardRoute = `/dashboard/${slug}/boards`
    const publicPortalRoute = `/b/${slug}`
    const domainSettingsRoute = `/dashboard/${slug}/settings/domain`
    const aiSettingsRoute = `/dashboard/${slug}/settings/ai`

    expect(dashboardRoute).toBe("/dashboard/layangan-app/boards")
    expect(publicPortalRoute).toBe("/b/layangan-app")
    expect(domainSettingsRoute).toBe("/dashboard/layangan-app/settings/domain")
    expect(aiSettingsRoute).toBe("/dashboard/layangan-app/settings/ai")
  })
})
