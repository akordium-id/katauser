import { describe, it, expect, vi } from "vitest"
import { ApiKeyRepository } from "../src/repositories/api-key"

describe("ApiKeyRepository Unit Tests", () => {
  it("creates an API key with raw token starting with ku_live_ and SHA-256 hash", async () => {
    const mockTx: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: "key_123",
              workspaceId: "ws_1",
              name: "Claude Code",
              keyPrefix: "ku_live_abcd",
              permissions: ["read", "write"],
            },
          ]),
        }),
      }),
    }
    const mockDb: any = {
      insert: mockTx.insert,
    }
    const repo = new ApiKeyRepository(mockDb)
    const result = await repo.createApiKey("ws_1", "Claude Code")

    expect(result.rawKey).toMatch(/^ku_live_[a-f0-9]{64}$/)
    expect(result.keyRecord.id).toBe("key_123")
    expect(mockTx.insert).toHaveBeenCalled()
  })

  it("validates raw API key and returns workspaceId and keyId", async () => {
    const mockKeyRecord = {
      id: "key_abc",
      workspaceId: "ws_acme",
      permissions: ["read", "write"],
      expiresAt: null,
    }

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockKeyRecord]),
          }),
        }),
      }),
    }

    const repo = new ApiKeyRepository(mockDb)
    const rawKey = "ku_live_" + "a".repeat(64)
    const validation = await repo.validateApiKey(rawKey)

    expect(validation.isValid).toBe(true)
    expect(validation.workspaceId).toBe("ws_acme")
    expect(validation.keyId).toBe("key_abc")
  })

  it("rejects invalid key formats and non-existent keys", async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }

    const repo = new ApiKeyRepository(mockDb)

    // Malformed key format
    const invalidFormat = await repo.validateApiKey("invalid_prefix_123")
    expect(invalidFormat.isValid).toBe(false)

    // Non-existent key
    const nonExistent = await repo.validateApiKey("ku_live_" + "b".repeat(64))
    expect(nonExistent.isValid).toBe(false)
  })

  it("rejects expired API keys", async () => {
    const expiredRecord = {
      id: "key_exp",
      workspaceId: "ws_acme",
      permissions: ["read", "write"],
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // expired 1 hour ago
    }

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([expiredRecord]),
          }),
        }),
      }),
    }

    const repo = new ApiKeyRepository(mockDb)
    const res = await repo.validateApiKey("ku_live_" + "c".repeat(64))
    expect(res.isValid).toBe(false)
  })

  it("lists and revokes API keys", async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: "key_1", name: "Claude" },
            { id: "key_2", name: "Cursor" },
          ]),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "key_1" }]),
        }),
      }),
    }

    const repo = new ApiKeyRepository(mockDb)
    const list = await repo.listApiKeys("ws_acme")
    expect(list).toHaveLength(2)

    const revoked = await repo.revokeApiKey("key_1", "ws_acme")
    expect(revoked).toBe(true)
  })

  it("records key usage with current timestamp", async () => {
    const mockDb: any = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: "key_1" }]),
        }),
      }),
    }

    const repo = new ApiKeyRepository(mockDb)
    await repo.recordKeyUsage("key_1")
    expect(mockDb.update).toHaveBeenCalled()
  })
})
