import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ cookies, fetch }) => {
  const token = cookies.get("katauser_session")
  if (token) {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Ignore network errors on logout
    }
    cookies.delete("katauser_session", { path: "/" })
  }
  throw redirect(303, "/")
}
