import { getStoredLastSeenDate, storeLastSeenDate } from "./changelog-helpers"

export type WidgetTab = "feedback" | "roadmap" | "changelog" | "messages"

export interface ChangelogSummary {
  id: string
  title: string
  slug: string
  content: string
  publishedAt: string
}

export interface WidgetUser {
  userId: string
  email: string
  name?: string
  verified?: boolean
}

export interface WidgetInitOptions {
  workspace: string
  apiUrl?: string
  primaryColor?: string
  position?: "bottom-right" | "bottom-left"
  showPopover?: boolean
}

export function createWidgetState() {
  let isOpen = false
  let activeTab: WidgetTab = "feedback"
  let unreadCount = 0
  let workspaceId: string | null = null
  let apiUrl = "http://localhost:3000"
  let user: WidgetUser | null = null
  let latestChangelog: ChangelogSummary | null = null
  let isPopoverDismissed = false
  let showPopover = true
  let subscribers: Array<() => void> = []

  const notify = () => {
    subscribers.forEach((cb) => cb())
  }

  return {
    get isOpen() {
      return isOpen
    },
    get activeTab() {
      return activeTab
    },
    get unreadCount() {
      return unreadCount
    },
    get workspaceId() {
      return workspaceId
    },
    get apiUrl() {
      return apiUrl
    },
    get user() {
      return user
    },
    get latestChangelog() {
      return latestChangelog
    },
    get isPopoverDismissed() {
      return isPopoverDismissed
    },
    get showPopover() {
      return showPopover
    },
    setShowPopover(val: boolean) {
      showPopover = val
      notify()
    },
    setLatestChangelog(rel: ChangelogSummary | null) {
      latestChangelog = rel
      notify()
    },
    dismissPopover() {
      isPopoverDismissed = true
      notify()
    },
    markChangelogAsRead(workspace: string, publishedAt?: string) {
      unreadCount = 0
      isPopoverDismissed = true
      if (publishedAt) {
        storeLastSeenDate(workspace, publishedAt)
      }
      notify()
    },
    async syncChangelogStatus(workspace: string, baseApiUrl?: string) {
      const url = (baseApiUrl || apiUrl).replace(/\/+$/, "")
      const lastSeen = getStoredLastSeenDate(workspace)
      try {
        const endpoint = `${url}/api/v1/workspaces/${encodeURIComponent(workspace)}/changelogs/latest${
          lastSeen ? `?since=${encodeURIComponent(lastSeen)}` : ""
        }`
        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            latestChangelog = data.latest ?? null
            unreadCount = data.unreadCount ?? 0
            notify()
          }
        }
      } catch {
        // Graceful fallback
      }
    },
    open() {
      isOpen = true
      notify()
    },
    close() {
      isOpen = false
      notify()
    },
    toggle() {
      isOpen = !isOpen
      notify()
    },
    setActiveTab(tab: WidgetTab) {
      activeTab = tab
      notify()
    },
    setUnreadCount(count: number) {
      unreadCount = count
      notify()
    },
    init(options: WidgetInitOptions) {
      workspaceId = options.workspace
      if (options.apiUrl) {
        apiUrl = options.apiUrl
      }
      if (options.showPopover !== undefined) {
        showPopover = options.showPopover
      }
      notify()
    },
    setUser(u: WidgetUser | null) {
      user = u
      notify()
    },
    subscribe(cb: () => void) {
      subscribers.push(cb)
      return () => {
        subscribers = subscribers.filter((s) => s !== cb)
      }
    },
  }
}

export type WidgetState = ReturnType<typeof createWidgetState>
export const globalWidgetState = createWidgetState()
