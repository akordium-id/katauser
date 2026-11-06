import { redirect } from "@sveltejs/kit"
import type { LayoutLoad } from "./$types"

export const _hasFullProfile = (
  profile: { full_name?: string | null } | null | undefined,
) => {
  return !!(profile && profile.full_name)
}

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
      unsubscribed: false,
    },
  }
}
