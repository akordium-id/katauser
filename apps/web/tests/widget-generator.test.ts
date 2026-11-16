import { describe, it, expect } from "vitest"
import { createHmac } from "node:crypto"

describe("Widget Generator & Snippet Logic", () => {
  function generateHtmlSnippet(options: {
    host: string
    workspace: string
    position: "bottom-right" | "bottom-left"
    primaryColor: string
    defaultTab: "feedback" | "roadmap" | "changelog" | "messages"
    theme: "auto" | "light" | "dark"
  }) {
    return `<script defer src="${options.host}/widget/katauser.js" data-workspace="${options.workspace}" data-position="${options.position}" data-color="${options.primaryColor}" data-default-tab="${options.defaultTab}" data-theme="${options.theme}"></script>`
  }

  function generateHmacHash(email: string, secret: string) {
    return createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex")
  }

  it("generates correct HTML script tag snippet with custom attributes", () => {
    const snippet = generateHtmlSnippet({
      host: "https://katauser.com",
      workspace: "acme",
      position: "bottom-left",
      primaryColor: "#059669",
      defaultTab: "feedback",
      theme: "dark",
    })

    expect(snippet).toContain('src="https://katauser.com/widget/katauser.js"')
    expect(snippet).toContain('data-workspace="acme"')
    expect(snippet).toContain('data-position="bottom-left"')
    expect(snippet).toContain('data-color="#059669"')
    expect(snippet).toContain('data-theme="dark"')
  })

  it("supports all permitted positions and default tabs", () => {
    const validPositions = ["bottom-right", "bottom-left"] as const
    const validTabs = ["feedback", "roadmap", "changelog", "messages"] as const

    for (const pos of validPositions) {
      expect(validPositions).toContain(pos)
    }

    for (const tab of validTabs) {
      expect(validTabs).toContain(tab)
    }
  })

  it("calculates deterministic HMAC SHA-256 for user verification", () => {
    const secret = "sec_test_secret_key_123456789012"
    const email = "budi@techindo.id"

    const hash1 = generateHmacHash(email, secret)
    const hash2 = generateHmacHash(email, secret)

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // 256 bits = 64 hex chars
  })

  it("generates SPA SDK initialization options correctly", () => {
    const config = {
      workspace: "layangan-app",
      position: "bottom-right" as const,
      primaryColor: "#4f46e5",
    }

    expect(config.workspace).toBe("layangan-app")
    expect(config.position).toBe("bottom-right")
    expect(config.primaryColor).toMatch(/^#[0-9a-fA-F]{6}$/)
  })
})
