import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ locals, url }) => {
  return {
    url: url.origin,
    user: locals.user,
  }
}
