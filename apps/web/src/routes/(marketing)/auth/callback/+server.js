import { redirect } from "@sveltejs/kit"

export const GET = async ({ url, locals }) => {
  const next = url.searchParams.get("next")
  if (locals.user) {
    throw redirect(303, next || "/account")
  }
  throw redirect(303, "/login/sign_in")
}
