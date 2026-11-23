const STORAGE_PREFIX = "katauser_changelog_seen_"

export function getStoredLastSeenDate(
  workspace: string,
  storage?: Storage,
): string | null {
  try {
    const s =
      storage ?? (typeof window !== "undefined" ? window.localStorage : null)
    if (!s) return null
    return s.getItem(STORAGE_PREFIX + workspace)
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
    const s =
      storage ?? (typeof window !== "undefined" ? window.localStorage : null)
    if (!s) return
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
  showPopover?: boolean
}): boolean {
  if (params.isOpen) return false
  if (params.showPopover === false) return false
  if (params.isDismissed) return false
  if (params.unreadCount <= 0) return false
  return true
}
