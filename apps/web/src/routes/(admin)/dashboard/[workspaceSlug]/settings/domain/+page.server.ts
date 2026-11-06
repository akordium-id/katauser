import { createApiClient } from "$lib/api"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workspaceSlug } = params
  const api = createApiClient(fetch)

  let customDomain = ""
  let verified = false

  try {
    const res = await (api.api.v1 as any).domains.verify.$get({
      query: { domain: `feedback.${workspaceSlug}.com`, workspaceSlug },
    })

    if (res.ok) {
      const data = await res.json()
      customDomain = data.domain || `feedback.${workspaceSlug}.com`
      verified = data.verified ?? false
    }
  } catch (err) {
    console.error("Failed to verify domain on load:", err)
  }

  return {
    workspaceSlug,
    customDomain: customDomain || `feedback.${workspaceSlug}.com`,
    verified: verified || true,
    expectedCname: "cname.katauser.com",
  }
}
