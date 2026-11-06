import { redirect } from "@sveltejs/kit"
import type { LayoutLoad } from "./$types"

export const load: LayoutLoad = async ({ data }) => {
  if (!data?.user) {
    redirect(303, "/login/sign_in")
  }

  return {
    user: data.user,
    profile: {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.name,
      company_name: "Acme",
      website: "https://acme.com",
    },
  }
}
