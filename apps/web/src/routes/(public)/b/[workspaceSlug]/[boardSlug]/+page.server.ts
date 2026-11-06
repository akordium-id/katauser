import { createApiClient } from "$lib/api"
import type { PageServerLoad } from "./$types"

export interface FeedbackPostItem {
  id: string
  title: string
  content: string
  status: string
  votesCount: number
  commentsCount: number
  hasVoted?: boolean
  createdAt: string
  [key: string]: unknown
}

export const load: PageServerLoad = async ({ fetch, params, url }) => {
  const { workspaceSlug, boardSlug } = params
  const sort =
    (url.searchParams.get("sort") as "top_voted" | "newest") || "top_voted"
  const status = url.searchParams.get("status") || undefined

  const api = createApiClient(fetch)

  // In production, boardId is resolved from boardSlug via API
  // For demo/dev bootstrap, fetch boards of workspace
  let posts: FeedbackPostItem[] = []
  let boardName = "Feature Requests"

  try {
    const boardsRes = await api.api.v1.workspaces[":slug"].boards.$get({
      param: { slug: workspaceSlug },
    })

    if (boardsRes.ok) {
      const { boards } = await boardsRes.json()
      const currentBoard =
        boards.find((b: { slug: string }) => b.slug === boardSlug) || boards[0]
      if (currentBoard) {
        boardName = currentBoard.name
        const postsRes = await api.api.v1.boards[":boardId"].posts.$get({
          param: { boardId: currentBoard.id },
          query: { sort, ...(status ? { status } : {}) },
        })
        if (postsRes.ok) {
          const data = await postsRes.json()
          posts = data.posts
        }
      }
    }
  } catch (err) {
    console.error("Failed to load feedback posts:", err)
  }

  return {
    workspaceSlug,
    boardSlug,
    boardName,
    sort,
    status,
    posts,
  }
}
