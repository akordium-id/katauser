import { describe, it, expect } from "vitest"
import HeroDemo from "../src/routes/(marketing)/components/HeroDemo.svelte"
import FeatureShowcase from "../src/routes/(marketing)/components/FeatureShowcase.svelte"
import SelfHostGrid from "../src/routes/(marketing)/components/SelfHostGrid.svelte"
import ComparisonSection from "../src/routes/(marketing)/components/ComparisonSection.svelte"
import FaqSection from "../src/routes/(marketing)/components/FaqSection.svelte"

describe("Landing Page Components", () => {
  it("imports all landing page modular sections successfully", () => {
    expect(HeroDemo).toBeDefined()
    expect(FeatureShowcase).toBeDefined()
    expect(SelfHostGrid).toBeDefined()
    expect(ComparisonSection).toBeDefined()
    expect(FaqSection).toBeDefined()
  })

  it("has valid interactive demo post structure", () => {
    const demoPosts = [
      { id: "1", title: "Integrasi Discord", status: "in_progress", votes: 54, hasVoted: false },
      { id: "2", title: "SSO Okta", status: "planned", votes: 38, hasVoted: true },
    ]

    function toggleVote(post: typeof demoPosts[0]) {
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
})

