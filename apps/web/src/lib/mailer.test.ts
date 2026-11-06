import { vi, describe, it, expect, beforeEach } from "vitest"

vi.mock("$env/dynamic/private")
vi.mock("resend")

import { Resend } from "resend"
import * as mailer from "./mailer"

describe("mailer", () => {
  const mockSend = vi.fn().mockResolvedValue({ id: "mock-email-id" })

  beforeEach(async () => {
    vi.clearAllMocks()
    const { env } = await import("$env/dynamic/private")
    env.PRIVATE_RESEND_API_KEY = "mock_resend_api_key"

    vi.mocked(Resend).mockImplementation(
      () =>
        ({
          emails: {
            send: mockSend,
          },
        }) as unknown as Resend,
    )
  })

  describe("sendUserEmail", () => {
    const mockUser = { id: "user123", email: "user@example.com" }

    it("sends welcome email", async () => {
      await mailer.sendUserEmail({
        user: mockUser,
        subject: "Welcome to our service",
        from_email: "welcome@example.com",
        template_name: "welcome_email",
        template_properties: {
          companyName: "Acme Inc",
          WebsiteBaseUrl: "https://example.com",
        },
      })

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "welcome@example.com",
          to: ["user@example.com"],
          subject: "Welcome to our service",
          html: expect.stringContaining("Thanks for joining Acme Inc."),
        }),
      )
    })

    it("aborts when user has no email", async () => {
      await mailer.sendUserEmail({
        user: { id: "no-email", email: "" },
        subject: "Test",
        from_email: "test@example.com",
        template_name: "welcome_email",
        template_properties: {},
      })

      expect(mockSend).not.toHaveBeenCalled()
    })
  })
})
