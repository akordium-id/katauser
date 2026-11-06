import { createApiClient } from "$lib/api"

export const load = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
  try {
    const api = createApiClient(fetch)
    const res = await api.api.v1.health.$get()
    if (res.ok) {
      const health = await res.json()
      return { apiHealth: health }
    }
  } catch {
    // Graceful fallback if api is offline during dev/build
  }
  return { apiHealth: { status: "offline", service: "katauser-api" } }
}
