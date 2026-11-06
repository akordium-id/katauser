import { createApiClient } from "$lib/api"
import type { PageServerLoad } from "./$types"

export interface BoardItem {
  id: string
  name: string
  slug: string
  description?: string | null
  isPrivate?: boolean
  allowGuestPosts?: boolean
  createdAt?: string
}

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workspaceSlug } = params
  const api = createApiClient(fetch)

  let boards: BoardItem[] = []
  try {
    const res = await api.api.v1.workspaces[":slug"].boards.$get({
      param: { slug: workspaceSlug },
    })
    if (res.ok) {
      const data = await res.json()
      boards = data.boards
    }
  } catch (err) {
    console.error("Failed to load admin boards:", err)
  }

  return {
    workspaceSlug,
    boards,
  }
}
