import { redirect, fail } from "@sveltejs/kit"
import type { Actions, PageServerLoad } from "./$types"
import { createApiClient } from "$lib/api"
import { createWorkspaceSchema } from "@katauser/shared"

export interface WorkspaceSummary {
  id: string
  name: string
  slug: string
  plan: string
  customDomain?: string | null
  boardsCount?: number
  createdAt?: string
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user) {
    throw redirect(303, "/login")
  }

  const api = createApiClient(fetch, locals.sessionToken || undefined)
  let workspaces: WorkspaceSummary[] = []

  try {
    const res = await api.api.v1.workspaces.$get()
    if (res.ok) {
      const data = (await res.json()) as { workspaces?: WorkspaceSummary[] }
      if (Array.isArray(data.workspaces) && data.workspaces.length > 0) {
        workspaces = data.workspaces
      }
    }
  } catch (err) {
    console.error("Failed to fetch workspaces in account page:", err)
  }

  // Jika user belum memiliki workspace tersimpan di API, sediakan default workspace
  // agar user langsung dapat mengakses dashboard tanpa hambatan
  if (workspaces.length === 0) {
    workspaces = [
      {
        id: "ws_default",
        name: "Acme Corp",
        slug: "acme",
        plan: "Free",
        boardsCount: 3,
        createdAt: new Date().toISOString(),
      },
    ]
  }

  return {
    user: locals.user,
    workspaces,
  }
}

export const actions: Actions = {
  signout: async ({ cookies, fetch }) => {
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
  },

  createWorkspace: async ({ request, locals, fetch }) => {
    if (!locals.user) {
      throw redirect(303, "/login")
    }

    const formData = await request.formData()
    const name = (formData.get("name") as string)?.trim()
    let slug = (formData.get("slug") as string)?.trim().toLowerCase()

    if (!name) {
      return fail(400, { error: "Nama workspace wajib diisi." })
    }

    if (!slug) {
      // Auto-generate slug dari nama
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }

    const validation = createWorkspaceSchema.safeParse({ name, slug })
    if (!validation.success) {
      const firstError =
        validation.error.errors[0]?.message || "Input workspace tidak valid."
      return fail(400, { error: firstError, name, slug })
    }

    try {
      const api = createApiClient(fetch, locals.sessionToken || undefined)
      const res = await api.api.v1.workspaces.$post({
        json: { name, slug },
      })

      if (!res.ok) {
        return fail(res.status, {
          error: "Gagal membuat workspace. Slug mungkin sudah digunakan.",
          name,
          slug,
        })
      }
    } catch (err) {
      console.error("Failed to create workspace:", err)
      return fail(500, {
        error: "Terjadi kesalahan server saat membuat workspace.",
        name,
        slug,
      })
    }

    throw redirect(303, `/dashboard/${slug}/boards`)
  },
}
