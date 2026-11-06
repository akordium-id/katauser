import { describe, it, expect } from "vitest"
import {
  widgetIdentifySchema,
  generateUserHmac,
  verifyUserHmac,
} from "../src/schemas/widget"

describe("Widget Identify Schema & HMAC Verification", () => {
  it("validates a valid widget identify payload", () => {
    const validData = {
      workspaceId: "acme-corp",
      userId: "user_123",
      email: "alex@example.com",
      name: "Alex Rivera",
      hash: "a1b2c3d4e5f6",
    }

    const parsed = widgetIdentifySchema.parse(validData)
    expect(parsed.workspaceId).toBe("acme-corp")
    expect(parsed.userId).toBe("user_123")
    expect(parsed.email).toBe("alex@example.com")
  })

  it("rejects invalid email formats", () => {
    const invalidData = {
      workspaceId: "acme-corp",
      userId: "user_123",
      email: "not-an-email",
    }

    expect(() => widgetIdentifySchema.parse(invalidData)).toThrow()
  })

  it("generates and verifies valid HMAC SHA-256 signatures", () => {
    const secret = "super-secret-workspace-key-12345"
    const userId = "usr_alex_998"

    const hmac = generateUserHmac(secret, userId)
    expect(typeof hmac).toBe("string")
    expect(hmac.length).toBe(64) // 64 hex characters for SHA-256

    // Valid verification
    expect(verifyUserHmac(secret, userId, hmac)).toBe(true)

    // Invalid hash verification
    expect(verifyUserHmac(secret, userId, "invalid_fake_hash")).toBe(false)

    // Tampered userId verification
    expect(verifyUserHmac(secret, "usr_impersonator", hmac)).toBe(false)
  })
})
