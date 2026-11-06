import { describe, it, expect } from "vitest"
import { hashPassword, verifyPassword } from "../src/services/password-hasher"

describe("Native Zero-Dependency Password Hasher", () => {
  it("hashes a plaintext password into salt:hash format", () => {
    const raw = "SuperSecret123!"
    const hashed = hashPassword(raw)
    expect(hashed).toContain(":")
    const [salt, key] = hashed.split(":")
    expect(salt.length).toBe(32) // 16 bytes hex
    expect(key.length).toBe(128) // 64 bytes hex
  })

  it("correctly verifies a valid password against its hash", () => {
    const raw = "PasswordValid#2026"
    const hashed = hashPassword(raw)
    expect(verifyPassword(raw, hashed)).toBe(true)
  })

  it("rejects an incorrect password", () => {
    const raw = "PasswordValid#2026"
    const hashed = hashPassword(raw)
    expect(verifyPassword("WrongPassword", hashed)).toBe(false)
  })

  it("rejects malformed hash string gracefully without crashing", () => {
    expect(verifyPassword("test", "")).toBe(false)
    expect(verifyPassword("test", "invalid-format")).toBe(false)
  })
})
