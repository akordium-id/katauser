import { createApiClient } from "$lib/api"
import type { PageServerLoad } from "./$types"

export interface CompletedPost {
  id: string
  title: string
  [key: string]: unknown
}

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workspaceSlug } = params
  const api = createApiClient(fetch)

  let completedPosts: CompletedPost[] = []

  try {
    const res = await api.api.v1.workspaces[":slug"].roadmap.$get({
      param: { slug: workspaceSlug },
    })

    if (res.ok) {
      const data = await res.json()
      completedPosts = data.roadmap?.completed || []
    }
  } catch (err) {
    console.error(
      "Failed to load completed roadmap items for changelog publisher:",
      err,
    )
  }

  return {
    workspaceSlug,
    completedPosts,
  }
}
