import { fail, redirect } from "@sveltejs/kit"
import type { Actions } from "./$types"

export const actions: Actions = {
  default: async ({ request, fetch, cookies }) => {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!name || !email || !password) {
      return fail(400, {
        error: "Semua kolom wajib diisi",
        name: name || "",
        email: email || "",
      })
    }

    if (password.length < 8) {
      return fail(400, {
        error: "Password minimal 8 karakter",
        name,
        email,
      })
    }

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        return fail(res.status || 400, {
          error: data.message || "Registrasi gagal",
          name,
          email,
        })
      }

      if (data.token) {
        cookies.set("katauser_session", data.token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        })
      }
    } catch {
      return fail(500, {
        error: "Terjadi kesalahan pada server. Silakan coba lagi.",
        name,
        email,
      })
    }

    throw redirect(303, "/account")
  },
}
