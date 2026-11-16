import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { createApiClient } from "$lib/api"

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workspaceSlug } = params
  const api = createApiClient(fetch)

  let targetBoardSlug = "fitur"

  try {
    const res = await api.api.v1.workspaces[":slug"].boards.$get({
      param: { slug: workspaceSlug },
    })

    if (res.ok) {
      const { boards } = (await res.json()) as { boards?: Array<{ slug: string }> }
      if (Array.isArray(boards) && boards.length > 0 && boards[0]?.slug) {
        targetBoardSlug = boards[0].slug
      }
    }
  } catch {
    // Fallback target board slug
  }

  throw redirect(303, `/b/${workspaceSlug}/${targetBoardSlug}`)
}
