import { eq } from "drizzle-orm"
import { createHash, randomBytes } from "node:crypto"
import { workspaceApiKeys } from "../schema/api-keys"

export class ApiKeyRepository {
  constructor(private db: any) {}

  static hashKey(rawKey: string): string {
    return createHash("sha256").update(rawKey).digest("hex")
  }

  async createApiKey(
    workspaceId: string,
    name: string,
    permissions: string[] = ["read", "write"],
    expiresAt?: Date | null,
  ): Promise<{ rawKey: string; keyRecord: any }> {
    const rawSecret = randomBytes(32).toString("hex")
    const rawKey = `ku_live_${rawSecret}`
    const keyHash = ApiKeyRepository.hashKey(rawKey)
    const keyPrefix = rawKey.substring(0, 12)
    const keyId = "key_" + Math.random().toString(36).substring(2, 12)

    const [keyRecord] = await this.db
      .insert(workspaceApiKeys)
      .values({
        id: keyId,
        workspaceId,
        name,
        keyHash,
        keyPrefix,
        permissions,
        expiresAt: expiresAt ?? null,
      })
      .returning()

    return { rawKey, keyRecord }
  }

  async validateApiKey(rawKey: string): Promise<{
    isValid: boolean
    workspaceId?: string
    keyId?: string
    permissions?: string[]
  }> {
    if (!rawKey || !rawKey.startsWith("ku_live_") || rawKey.length < 20) {
      return { isValid: false }
    }

    const keyHash = ApiKeyRepository.hashKey(rawKey)

    const [record] = await this.db
      .select()
      .from(workspaceApiKeys)
      .where(eq(workspaceApiKeys.keyHash, keyHash))
      .limit(1)

    if (!record) {
      return { isValid: false }
    }

    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return { isValid: false }
    }

    return {
      isValid: true,
      workspaceId: record.workspaceId,
      keyId: record.id,
      permissions: record.permissions,
    }
  }

  async recordKeyUsage(keyId: string): Promise<void> {
    await this.db
      .update(workspaceApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(workspaceApiKeys.id, keyId))
  }

  async listApiKeys(workspaceId: string): Promise<any[]> {
    return this.db
      .select({
        id: workspaceApiKeys.id,
        name: workspaceApiKeys.name,
        keyPrefix: workspaceApiKeys.keyPrefix,
        permissions: workspaceApiKeys.permissions,
        lastUsedAt: workspaceApiKeys.lastUsedAt,
        expiresAt: workspaceApiKeys.expiresAt,
        createdAt: workspaceApiKeys.createdAt,
      })
      .from(workspaceApiKeys)
      .where(eq(workspaceApiKeys.workspaceId, workspaceId))
  }

  async revokeApiKey(keyId: string, workspaceId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(workspaceApiKeys)
      .where(eq(workspaceApiKeys.id, keyId))
      .returning()
    return deleted.length > 0
  }
}
