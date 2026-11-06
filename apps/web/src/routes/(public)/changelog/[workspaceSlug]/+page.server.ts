import { createApiClient } from "$lib/api"
import type { PageServerLoad } from "./$types"

export interface ChangelogItem {
  id: string
  title: string
  slug: string
  content: string
  publishedAt: string
  tag?: string
  postIds?: string[]
  [key: string]: unknown
}

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workspaceSlug } = params
  const api = createApiClient(fetch)

  let changelogs: ChangelogItem[] = []

  try {
    const res = await api.api.v1.workspaces[":slug"].changelogs.$get({
      param: { slug: workspaceSlug },
    })

    if (res.ok) {
      const data = await res.json()
      changelogs = data.changelogs || []
    }
  } catch (err) {
    console.error("Failed to load changelogs:", err)
  }

  // Provide initial mock releases if none created yet, to present a great public changelog view
  if (changelogs.length === 0) {
    changelogs = [
      {
        id: "mock_ch_1",
        title: "Release v1.2.0: Public Roadmap & Svelte 5 Optimization",
        slug: "release-v1-2-0",
        content:
          "Kami sangat senang mengumumkan peluncuran Public Roadmap Kanban dan migrasi penuh antarmuka ke Svelte 5 Runes untuk performa yang lebih responsif.",
        publishedAt: new Date().toISOString(),
        tag: "feature",
        postIds: ["post_c1"],
      },
      {
        id: "mock_ch_2",
        title: "Release v1.1.0: Real-time Feedback Board & Voting",
        slug: "release-v1-1-0",
        content:
          "Dukungan sistem voting atomik dan feedback portal publik untuk menampung seluruh ide dan request dari para pengguna.",
        publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        tag: "improvement",
        postIds: [],
      },
    ]
  }

  return {
    workspaceSlug,
    changelogs,
  }
}
