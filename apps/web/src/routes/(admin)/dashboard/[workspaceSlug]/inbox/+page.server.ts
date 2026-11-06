import { createApiClient } from "$lib/api"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workspaceSlug } = params
  const api = createApiClient(fetch)

  let conversations: any[] = []

  try {
    const res = await (api.api.v1 as any).workspaces[
      ":slug"
    ].conversations.$get({
      param: { slug: workspaceSlug },
    })

    if (res.ok) {
      const data = await res.json()
      conversations = data.conversations || []
    }
  } catch (err) {
    console.error("Failed to load conversations for inbox:", err)
  }

  // Provide initial demo conversations if none exist
  if (conversations.length === 0) {
    conversations = [
      {
        id: "conv_demo_1",
        workspaceId: workspaceSlug,
        endUserId: "alex@startup.io",
        status: "open",
        assignedTo: "human",
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        lastMessage: "Halo, saya butuh bantuan invoice tahunan enterprise.",
      },
      {
        id: "conv_demo_2",
        workspaceId: workspaceSlug,
        endUserId: "siti@agency.id",
        status: "open",
        assignedTo: "ai_juno",
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        lastMessage: "Bagaimana cara menambahkan widget ke website Webflow?",
      },
      {
        id: "conv_demo_3",
        workspaceId: workspaceSlug,
        endUserId: "budi@tech.co",
        status: "closed",
        assignedTo: "human",
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        lastMessage: "Terima kasih, masalah SSL custom domain sudah selesai.",
      },
    ]
  }

  return {
    workspaceSlug,
    conversations,
  }
}
