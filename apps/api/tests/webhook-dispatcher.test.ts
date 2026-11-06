import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  formatSlackPayload,
  formatDiscordPayload,
  dispatchWebhookEvent,
} from "../src/modules/integrations/webhook-dispatcher"
import type { WebhookEvent, WebhookConfig } from "@katauser/shared"

describe("Outbound Webhook Dispatcher (Slack & Discord)", () => {
  const mockPostCreatedEvent: WebhookEvent = {
    event: "post.created",
    workspaceSlug: "acme",
    timestamp: new Date().toISOString(),
    data: {
      title: "Dark Mode Support",
      content: "Please add dark mode option to dashboard",
      authorName: "Alice",
      authorEmail: "alice@acme.com",
      url: "https://acme.katauser.com/b/feedback/dark-mode",
    },
  }

  const mockChatEscalatedEvent: WebhookEvent = {
    event: "chat.escalated",
    workspaceSlug: "acme",
    timestamp: new Date().toISOString(),
    data: {
      conversationId: "conv_123",
      authorName: "Bob",
      initialMessage: "Saya butuh bantuan billing segera!",
      url: "https://katauser.com/dashboard/acme/inbox",
    },
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("formats Slack Block Kit payload correctly for post.created", () => {
    const payload = formatSlackPayload(mockPostCreatedEvent)
    expect(payload.text).toContain("Ide Feedback Baru di Katauser")
    expect(payload.blocks).toBeDefined()
    expect(Array.isArray(payload.blocks)).toBe(true)
    const jsonStr = JSON.stringify(payload)
    expect(jsonStr).toContain("Dark Mode Support")
    expect(jsonStr).toContain("Alice")
  })

  it("formats Discord Rich Embed payload correctly for chat.escalated", () => {
    const payload = formatDiscordPayload(mockChatEscalatedEvent)
    expect(payload.embeds).toBeDefined()
    expect(payload.embeds[0].title).toContain("Live Chat Butuh Bantuan Staf")
    expect(payload.embeds[0].color).toBe(0xe11d48) // red/rose alert
    expect(payload.embeds[0].description).toContain(
      "Saya butuh bantuan billing segera!",
    )
  })

  it("dispatches webhook event to configured Slack and Discord URLs asynchronously without throwing", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "ok",
    })
    vi.stubGlobal("fetch", mockFetch)

    const config: WebhookConfig = {
      slackWebhookUrl: "https://hooks.slack.com/services/T00/B00/X00",
      discordWebhookUrl: "https://discord.com/api/webhooks/123/xyz",
      enabledEvents: ["post.created", "chat.escalated"],
    }

    const result = await dispatchWebhookEvent(config, mockPostCreatedEvent)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result.slackSuccess).toBe(true)
    expect(result.discordSuccess).toBe(true)
  })

  it("handles webhook fetch failure gracefully without breaking execution", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new Error("Network connection timeout"))
    vi.stubGlobal("fetch", mockFetch)

    const config: WebhookConfig = {
      slackWebhookUrl: "https://hooks.slack.com/services/fail",
      enabledEvents: ["post.created"],
    }

    const result = await dispatchWebhookEvent(config, mockPostCreatedEvent)
    expect(result.slackSuccess).toBe(false)
  })
})
