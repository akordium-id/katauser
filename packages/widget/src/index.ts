import "./KatauserWidget.svelte"
import {
  globalWidgetState,
  type WidgetInitOptions,
  type WidgetTab,
  type WidgetUser,
} from "./sdk"

export * from "./sdk"

/**
 * Ensures `<katauser-widget>` exists in the DOM
 */
function ensureWidgetMounted(workspace: string, apiUrl?: string): HTMLElement {
  if (typeof document === "undefined") {
    return {} as HTMLElement
  }

  let el = document.querySelector("katauser-widget") as HTMLElement | null
  if (!el) {
    el = document.createElement("katauser-widget")
    el.setAttribute("workspace", workspace)
    if (apiUrl) {
      el.setAttribute("api-url", apiUrl)
    }
    document.body.appendChild(el)
  }
  return el
}

export const Katauser = {
  /**
   * Initialize widget with workspace configuration
   */
  init(options: WidgetInitOptions) {
    globalWidgetState.init(options)
    if (typeof document !== "undefined") {
      ensureWidgetMounted(options.workspace, options.apiUrl)
    }
    return Katauser
  },

  /**
   * Identify current user (with optional HMAC hash)
   */
  async identify(user: {
    userId: string
    email: string
    name?: string
    hash?: string
  }) {
    globalWidgetState.setUser({
      userId: user.userId,
      email: user.email,
      name: user.name,
      verified: Boolean(user.hash),
    })

    // Optionally verify with Katauser API
    if (globalWidgetState.workspaceId) {
      try {
        const endpoint = `${globalWidgetState.apiUrl}/api/v1/widget/identify`
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: globalWidgetState.workspaceId,
            userId: user.userId,
            email: user.email,
            name: user.name,
            hash: user.hash,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            globalWidgetState.setUser(data.user)
          }
        }
      } catch (err) {
        console.warn("[Katauser] User identification API error:", err)
      }
    }
    return Katauser
  },

  /**
   * Open widget modal
   */
  open() {
    globalWidgetState.open()
    return Katauser
  },

  /**
   * Close widget modal
   */
  close() {
    globalWidgetState.close()
    return Katauser
  },

  /**
   * Toggle widget modal
   */
  toggle() {
    globalWidgetState.toggle()
    return Katauser
  },

  /**
   * Set active tab
   */
  setTab(tab: WidgetTab) {
    globalWidgetState.setActiveTab(tab)
    return Katauser
  },

  /**
   * Get current state
   */
  get state() {
    return globalWidgetState
  },
}

// Expose globally for browser script tag usage
if (typeof window !== "undefined") {
  ;(window as any).Katauser = Katauser

  // Auto-init via data-workspace script tag attribute
  const currentScript =
    document.currentScript || document.querySelector("script[data-workspace]")

  if (currentScript) {
    const workspace = currentScript.getAttribute("data-workspace")
    const apiUrl = currentScript.getAttribute("data-api-url") || undefined
    if (workspace) {
      Katauser.init({ workspace, apiUrl })
    }
  }
}

export default Katauser
