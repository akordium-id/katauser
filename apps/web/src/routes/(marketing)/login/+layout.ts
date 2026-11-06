import { redirect } from "@sveltejs/kit"
import type { LayoutLoad } from "./$types"

export const load: LayoutLoad = async ({ data }) => {
  if (data?.user) {
    redirect(303, "/account")
  }

  return {
    url: data.url,
  }
}
