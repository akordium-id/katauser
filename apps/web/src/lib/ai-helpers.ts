/**
 * Format similarity score as percentage
 */
export function formatSimilarityPercent(score: number): string {
  const clamped = Math.max(0, Math.min(1, score))
  return `${Math.round(clamped * 100)}% Kemiripan`
}

/**
 * Truncate long knowledge chunk snippet for UI preview
 */
export function truncateSnippet(text: string, maxLength = 120): string {
  if (!text) return ""
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength)}...`
}
