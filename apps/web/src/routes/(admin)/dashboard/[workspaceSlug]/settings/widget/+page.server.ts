import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params, url }) => {
  const { workspaceSlug } = params
  const host = url.origin || "http://localhost:3000"

  return {
    workspaceSlug,
    host,
    defaultConfig: {
      position: "bottom-right",
      primaryColor: "#4f46e5",
      defaultTab: "feedback",
      theme: "auto",
    },
    demoJwtSecret: "sec_" + Buffer.from(workspaceSlug + "_demo_secret").toString("hex").slice(0, 24),
  }
}
