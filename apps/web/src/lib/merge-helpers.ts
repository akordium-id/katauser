export interface PostStats {
  votesCount: number
  totalMrr: number
}

export function validateMergeTarget(
  sourcePostId: string,
  targetPostId: string,
): { valid: boolean; error: string | null } {
  if (!targetPostId || !targetPostId.trim()) {
    return { valid: false, error: "Pilih post target tujuan" }
  }
  if (sourcePostId === targetPostId) {
    return {
      valid: false,
      error: "Tidak dapat menggabungkan post ke dirinya sendiri",
    }
  }
  return { valid: true, error: null }
}

export function calculateMergedSummary(
  source: PostStats,
  target: PostStats,
): {
  combinedVotes: number
  combinedMrr: number
  formattedMrr: string
} {
  const combinedVotes = (source.votesCount || 0) + (target.votesCount || 0)
  const combinedMrr = (source.totalMrr || 0) + (target.totalMrr || 0)
  return {
    combinedVotes,
    combinedMrr,
    formattedMrr: `$${combinedMrr.toLocaleString("en-US")}`,
  }
}

export function formatVoteOnBehalfPayload(input: {
  customerEmail: string
  customerName?: string
  company?: string
  mrrStr?: string
  internalNote?: string
}): {
  customerEmail: string
  customerName?: string
  company?: string
  mrr?: number
  internalNote?: string
} {
  const customerEmail = input.customerEmail.trim()
  const customerName = input.customerName?.trim() || undefined
  const company = input.company?.trim() || undefined
  const internalNote = input.internalNote?.trim() || undefined
  const parsedMrr = input.mrrStr?.trim()
    ? parseFloat(input.mrrStr.trim())
    : undefined
  const mrr =
    parsedMrr !== undefined && !isNaN(parsedMrr) && parsedMrr >= 0
      ? parsedMrr
      : undefined

  return {
    customerEmail,
    customerName,
    company,
    mrr,
    internalNote,
  }
}
