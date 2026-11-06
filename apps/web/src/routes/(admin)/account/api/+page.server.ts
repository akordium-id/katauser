import { fail, redirect } from "@sveltejs/kit"

export const actions = {
  toggleEmailSubscription: async ({ locals }) => {
    if (!locals.user) {
      throw redirect(303, "/login/sign_in")
    }

    return {
      unsubscribed: false,
    }
  },

  updateEmail: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, "/login/sign_in")
    }

    const formData = await request.formData()
    const email = formData.get("email") as string

    let validationError
    if (!email || email === "") {
      validationError = "An email address is required"
    } else if (!email.includes("@")) {
      validationError = "A valid email address is required"
    }
    if (validationError) {
      return fail(400, {
        errorMessage: validationError,
        errorFields: ["email"],
        email,
      })
    }

    return {
      email,
    }
  },

  updatePassword: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, "/login/sign_in")
    }

    const formData = await request.formData()
    const newPassword1 = formData.get("newPassword1") as string
    const newPassword2 = formData.get("newPassword2") as string
    const currentPassword = formData.get("currentPassword") as string

    let validationError
    const errorFields: string[] = []
    if (!newPassword1) {
      validationError = "You must type a new password"
      errorFields.push("newPassword1")
    }
    if (!newPassword2) {
      validationError = "You must type the new password twice"
      errorFields.push("newPassword2")
    }
    if (newPassword1 && newPassword1.length < 8) {
      validationError = "The new password must be at least 8 characters long"
      errorFields.push("newPassword1")
    }
    if (newPassword1 && newPassword1.length > 72) {
      validationError = "The new password can be at most 72 characters long"
      errorFields.push("newPassword1")
    }
    if (newPassword1 !== newPassword2) {
      validationError = "The passwords don't match"
      errorFields.push("newPassword1")
      errorFields.push("newPassword2")
    }
    if (!currentPassword) {
      validationError = "You must include your current password"
      errorFields.push("currentPassword")
    }
    if (validationError) {
      return fail(400, {
        errorMessage: validationError,
        errorFields: [...new Set(errorFields)],
        newPassword1,
        newPassword2,
        currentPassword,
      })
    }

    return {
      newPassword1,
      newPassword2,
      currentPassword,
    }
  },

  deleteAccount: async ({ request, locals, cookies, fetch }) => {
    if (!locals.user) {
      throw redirect(303, "/login/sign_in")
    }

    const formData = await request.formData()
    const currentPassword = formData.get("currentPassword") as string

    if (!currentPassword) {
      return fail(400, {
        errorMessage:
          "You must provide your current password to delete your account.",
        errorFields: ["currentPassword"],
        currentPassword,
      })
    }

    const token = cookies.get("katauser_session")
    if (token) {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // ignore logout error on session delete
      }
      cookies.delete("katauser_session", { path: "/" })
    }

    throw redirect(303, "/")
  },

  updateProfile: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(303, "/login/sign_in")
    }

    const formData = await request.formData()
    const fullName = formData.get("fullName") as string
    const companyName = formData.get("companyName") as string
    const website = formData.get("website") as string

    let validationError
    const fieldMaxTextLength = 50
    const errorFields: string[] = []
    if (!fullName) {
      validationError = "Name is required"
      errorFields.push("fullName")
    } else if (fullName.length > fieldMaxTextLength) {
      validationError = `Name must be less than ${fieldMaxTextLength} characters`
      errorFields.push("fullName")
    }
    if (!companyName) {
      validationError = "Company name is required."
      errorFields.push("companyName")
    } else if (companyName.length > fieldMaxTextLength) {
      validationError = `Company name must be less than ${fieldMaxTextLength} characters`
      errorFields.push("companyName")
    }
    if (!website) {
      validationError = "Company website is required."
      errorFields.push("website")
    } else if (website.length > fieldMaxTextLength) {
      validationError = `Company website must be less than ${fieldMaxTextLength} characters`
      errorFields.push("website")
    }
    if (validationError) {
      return fail(400, {
        errorMessage: validationError,
        errorFields,
        fullName,
        companyName,
        website,
      })
    }

    return {
      fullName,
      companyName,
      website,
    }
  },

  signout: async ({ cookies, fetch }) => {
    const token = cookies.get("katauser_session")
    if (token) {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // ignore logout error on session delete
      }
      cookies.delete("katauser_session", { path: "/" })
    }
    throw redirect(303, "/")
  },
}
