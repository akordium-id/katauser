const STORAGE_PREFIX = "katauser_changelog_seen_"

export function getStoredLastSeenDate(
  workspace: string,
  storage?: Storage,
): string | null {
  try {
    const s =
      storage ?? (typeof window !== "undefined" ? window.localStorage : null)
    if (!s) return null
    const val = s.getItem(STORAGE_PREFIX + workspace)
    if (!val || val === "undefined" || val === "null") return null
    const parsed = new Date(val)
    if (isNaN(parsed.getTime())) return null
    return val
  } catch {
    return null
  }
}

export function storeLastSeenDate(
  workspace: string,
  dateIso: string,
  storage?: Storage,
): void {
  try {
    if (!dateIso || dateIso === "undefined" || dateIso === "null") return
    const newTime = new Date(dateIso).getTime()
    if (isNaN(newTime)) return

    const s =
      storage ?? (typeof window !== "undefined" ? window.localStorage : null)
    if (!s) return

    // Prevent backward overwrite ([I3])
    const existing = getStoredLastSeenDate(workspace, s)
    if (existing) {
      const existingTime = new Date(existing).getTime()
      if (!isNaN(existingTime) && existingTime >= newTime) {
        return
      }
    }

    s.setItem(STORAGE_PREFIX + workspace, dateIso)
  } catch {}
}

export function calculateUnreadCount(
  releases: Array<{ publishedAt?: string | null }>,
  sinceDate?: string | null,
): number {
  if (!releases || releases.length === 0) return 0
  if (!sinceDate) return releases.length

  const since = new Date(sinceDate)
  if (isNaN(since.getTime())) return releases.length

  return releases.filter((r) => {
    if (!r.publishedAt) return false
    const pub = new Date(r.publishedAt)
    return !isNaN(pub.getTime()) && pub.getTime() > since.getTime()
  }).length
}

export function shouldDisplayPopover(params: {
  isOpen: boolean
  unreadCount: number
  isDismissed: boolean
  showPopover?: boolean | string
}): boolean {
  if (params.isOpen) return false
  if (
    params.showPopover === false ||
    (params.showPopover as unknown) === "false"
  ) {
    return false
  }
  if (params.isDismissed) return false
  if (params.unreadCount <= 0) return false
  return true
}
