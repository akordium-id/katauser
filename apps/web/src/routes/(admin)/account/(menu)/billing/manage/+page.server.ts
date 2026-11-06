import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user
  if (!user?.id) {
    redirect(303, "/login/sign_in")
  }
  redirect(303, "/account/billing")
}
