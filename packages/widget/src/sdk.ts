export type WidgetTab = "feedback" | "roadmap" | "changelog" | "messages"

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
}

export function createWidgetState() {
  let isOpen = false
  let activeTab: WidgetTab = "feedback"
  let unreadCount = 0
  let workspaceId: string | null = null
  let apiUrl = "http://localhost:3000"
  let user: WidgetUser | null = null
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
