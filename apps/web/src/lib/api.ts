import { hc } from "hono/client"
import type { AppType } from "@katauser/api/app"

export function createApiClient(
  fetchFn: typeof fetch = fetch,
  authToken?: string,
  baseUrl?: string,
) {
  const resolvedBaseUrl =
    baseUrl ||
    (typeof window !== "undefined"
      ? (import.meta.env.PUBLIC_API_URL as string) || "http://localhost:4000"
      : (process.env.INTERNAL_API_URL as string) || "http://localhost:4000")

  return hc<AppType>(resolvedBaseUrl, {
    fetch: fetchFn,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  })
}

export type ApiClient = ReturnType<typeof createApiClient>
