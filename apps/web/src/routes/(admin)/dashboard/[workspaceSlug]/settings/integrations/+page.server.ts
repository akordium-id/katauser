import type { PageServerLoad, Actions } from "./$types"
import { fail } from "@sveltejs/kit"
import { validateWebhookUrl } from "$lib/integrations-helpers"

export const load: PageServerLoad = async ({ params, fetch }) => {
  const workspaceSlug = params.workspaceSlug

  let linearState = {
    connected: false,
    organizationName: undefined as string | undefined,
    defaultTeamId: undefined as string | undefined,
  }

  try {
    const res = await fetch(
      `/api/v1/workspaces/${workspaceSlug}/integrations/linear`,
    )
    if (res.ok) {
      const json = await res.json()
      if (json.success && json.connected) {
        linearState = {
          connected: true,
          organizationName: json.organizationName,
          defaultTeamId: json.defaultTeamId,
        }
      }
    }
  } catch {
    // fallback if mock or offline
  }

  return {
    workspaceSlug,
    webhook: {
      slackWebhookUrl: "",
      discordWebhookUrl: "",
      enabledEvents: ["post.created", "post.voted", "chat.escalated"],
    },
    linear: linearState,
  }
}

export const actions: Actions = {
  saveWebhook: async ({ request }) => {
    const data = await request.formData()
    const slackUrl = (data.get("slackWebhookUrl") as string) || ""
    const discordUrl = (data.get("discordWebhookUrl") as string) || ""

    const slackCheck = validateWebhookUrl(slackUrl, "slack")
    if (!slackCheck.valid) {
      return fail(400, { error: slackCheck.error, slackUrl, discordUrl })
    }

    const discordCheck = validateWebhookUrl(discordUrl, "discord")
    if (!discordCheck.valid) {
      return fail(400, { error: discordCheck.error, slackUrl, discordUrl })
    }

    return {
      success: true,
      message: "Pengaturan integrasi webhook berhasil disimpan!",
    }
  },
}
