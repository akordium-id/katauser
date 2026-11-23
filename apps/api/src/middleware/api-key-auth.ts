import type { Context, Next } from "hono"
import { createHash } from "node:crypto"

export interface ApiKeyRecord {
  id: string
  workspaceId: string
  name: string
  keyHash: string
  keyPrefix: string
  permissions: string[]
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
}

export const apiKeysStore: ApiKeyRecord[] = []

export function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex")
}

export function registerApiKeyForWorkspace(
  rawKey: string,
  workspaceId: string,
  permissions: string[] = ["read", "write"],
  name: string = "API Key",
): ApiKeyRecord {
  const keyHash = hashKey(rawKey)
  const keyRecord: ApiKeyRecord = {
    id: "key_" + Math.random().toString(36).substring(2, 10),
    workspaceId,
    name,
    keyHash,
    keyPrefix: rawKey.substring(0, 12),
    permissions,
    expiresAt: null,
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
  }
  apiKeysStore.push(keyRecord)
  return keyRecord
}

export function clearApiKeysStore(): void {
  apiKeysStore.length = 0
}

export async function requireApiKey(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        message:
          "Unauthorized: Missing or malformed Authorization header. Expected Bearer ku_live_...",
      },
      401,
    )
  }

  const rawKey = authHeader.replace(/^Bearer\s+/, "").trim()
  if (!rawKey.startsWith("ku_live_") || rawKey.length < 20) {
    return c.json(
      {
        success: false,
        message: "Unauthorized: Invalid API key format",
      },
      401,
    )
  }

  const keyHash = hashKey(rawKey)
  const matched = apiKeysStore.find((k) => k.keyHash === keyHash)

  if (!matched) {
    return c.json(
      {
        success: false,
        message: "Unauthorized: API key not found or revoked",
      },
      401,
    )
  }

  if (matched.expiresAt && new Date(matched.expiresAt) < new Date()) {
    return c.json(
      {
        success: false,
        message: "Unauthorized: API key has expired",
      },
      401,
    )
  }

  matched.lastUsedAt = new Date().toISOString()

  c.set("workspaceId", matched.workspaceId)
  c.set("apiKeyId", matched.id)
  c.set("apiKeyPermissions", matched.permissions)

  await next()
}
