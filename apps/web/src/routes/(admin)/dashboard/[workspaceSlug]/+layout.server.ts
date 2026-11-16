import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    throw redirect(303, "/login/sign_in")
  }

  return {
    workspaceSlug: params.workspaceSlug,
    user: locals.user,
  }
}
