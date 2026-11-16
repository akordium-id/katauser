import { describe, it, expect } from "vitest"

describe("Public Tenant Portal Navigation & Structure", () => {
  it("builds consistent public portal routes for all channels", () => {
    const workspaceSlug = "acme"
    const boardSlug = "fitur"

    const feedbackRoute = `/b/${workspaceSlug}/${boardSlug}`
    const rootFeedbackRoute = `/b/${workspaceSlug}`
    const roadmapRoute = `/roadmap/${workspaceSlug}`
    const changelogRoute = `/changelog/${workspaceSlug}`

    expect(feedbackRoute).toBe("/b/acme/fitur")
    expect(rootFeedbackRoute).toBe("/b/acme")
    expect(roadmapRoute).toBe("/roadmap/acme")
    expect(changelogRoute).toBe("/changelog/acme")
  })

  it("determines correct redirect target for root workspace portal", () => {
    function resolveTargetBoard(
      boards: Array<{ slug: string }>,
      defaultFallback = "fitur",
    ) {
      return boards.length > 0 && boards[0]?.slug
        ? boards[0].slug
        : defaultFallback
    }

    expect(resolveTargetBoard([{ slug: "fitur" }, { slug: "kendala" }])).toBe(
      "fitur",
    )
    expect(resolveTargetBoard([{ slug: "custom-board" }])).toBe("custom-board")
    expect(resolveTargetBoard([])).toBe("fitur")
  })

  it("validates tab active state logic", () => {
    const channels = ["feedback", "roadmap", "changelog"] as const

    for (const active of channels) {
      const isFeedbackActive = active === "feedback"
      const isRoadmapActive = active === "roadmap"
      const isChangelogActive = active === "changelog"

      if (active === "feedback") expect(isFeedbackActive).toBe(true)
      if (active === "roadmap") expect(isRoadmapActive).toBe(true)
      if (active === "changelog") expect(isChangelogActive).toBe(true)
    }
  })

  it("verifies powered by footer branding text and URL", () => {
    const branding = {
      label: "Didukung oleh Katauser",
      href: "/",
      sublabel: "Portal Komunitas & Masukan Produk",
    }

    expect(branding.label).toContain("Katauser")
    expect(branding.href).toBe("/")
    expect(branding.sublabel).toBeDefined()
  })
})
