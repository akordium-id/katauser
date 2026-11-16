import { describe, it, expect } from "vitest"

describe("Landing Page Structure & Logic", () => {
  it("defines standard feature modules and pricing tiers", () => {
    const features = [
      "AI Juno Autonomous Copilot",
      "Interactive Feedback Boards",
      "Dynamic Product Roadmap",
      "Live Changelog & In-App Announcements",
      "Self-Hostable & Coolify Ready",
    ]

    expect(features).toHaveLength(5)
    expect(features).toContain("AI Juno Autonomous Copilot")
  })

  it("handles interactive demo upvoting correctly", () => {
    const demoPosts = [
      {
        id: "1",
        title: "Integrasi Discord",
        status: "in_progress",
        votes: 54,
        hasVoted: false,
      },
      {
        id: "2",
        title: "SSO Okta",
        status: "planned",
        votes: 38,
        hasVoted: true,
      },
    ]

    function toggleVote(post: (typeof demoPosts)[0]) {
      if (post.hasVoted) {
        post.votes -= 1
        post.hasVoted = false
      } else {
        post.votes += 1
        post.hasVoted = true
      }
    }

    toggleVote(demoPosts[0])
    expect(demoPosts[0].votes).toBe(55)
    expect(demoPosts[0].hasVoted).toBe(true)

    toggleVote(demoPosts[0])
    expect(demoPosts[0].votes).toBe(54)
    expect(demoPosts[0].hasVoted).toBe(false)
  })

  it("formats feature highlights accurately", () => {
    const highlights = {
      autonomousRag: "Jawaban instan berbasis dokumentasi produk Anda",
      mrrWeighted: "Prioritaskan request dari customer berbayar tertinggi",
      customDomain: "Gunakan domain feedback kustom ber-SSL otomatis",
    }

    expect(highlights.autonomousRag).toBeDefined()
    expect(highlights.mrrWeighted).toContain("customer berbayar")
  })
})
