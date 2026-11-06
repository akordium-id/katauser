import { createApiClient } from "$lib/api"
import type { RoadmapData } from "$lib/roadmap-helpers"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workspaceSlug } = params
  const api = createApiClient(fetch)

  let roadmap: RoadmapData = {
    planned: [],
    inProgress: [],
    completed: [],
  }

  try {
    const res = await api.api.v1.workspaces[":slug"].roadmap.$get({
      param: { slug: workspaceSlug },
    })

    if (res.ok) {
      const data = await res.json()
      roadmap = data.roadmap
    }
  } catch (err) {
    console.error("Failed to load roadmap:", err)
  }

  return {
    workspaceSlug,
    roadmap,
  }
}
