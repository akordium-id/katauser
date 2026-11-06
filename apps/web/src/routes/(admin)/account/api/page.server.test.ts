import { describe, it, expect, vi, beforeEach } from "vitest"
import { actions } from "./+page.server"
import { fail, redirect } from "@sveltejs/kit"

vi.mock("@sveltejs/kit", async () => {
  const actual = await vi.importActual("@sveltejs/kit")
  return {
    ...actual,
    fail: vi.fn(),
    redirect: vi.fn().mockImplementation(() => {
      throw new Error("Redirect error")
    }),
  }
})

describe("account api actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("toggleEmailSubscription", () => {
    it("should redirect if no user", async () => {
      await expect(
        actions.toggleEmailSubscription({
          locals: { user: null },
        } as any),
      ).rejects.toThrow("Redirect")

      expect(redirect).toHaveBeenCalledWith(303, "/login/sign_in")
    })

    it("should toggle subscription status when user is present", async () => {
      const result = await actions.toggleEmailSubscription({
        locals: { user: { id: "user123", email: "test@example.com" } },
      } as any)

      expect(result).toEqual({ unsubscribed: false })
    })
  })

  describe("updateEmail", () => {
    it("should fail on invalid email", async () => {
      const formData = new FormData()
      formData.set("email", "invalid-email")

      const request = {
        formData: async () => formData,
      } as unknown as Request

      await actions.updateEmail({
        request,
        locals: { user: { id: "user123", email: "old@example.com" } },
      } as any)

      expect(fail).toHaveBeenCalledWith(400, expect.objectContaining({
        errorMessage: "A valid email address is required",
      }))
    })
  })
})
