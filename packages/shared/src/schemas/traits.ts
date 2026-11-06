import { z } from "zod"

export const userTraitsSchema = z.object({
  plan: z.string().optional(),
  mrr: z.number().min(0).optional(),
  company: z.string().optional(),
  custom: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
})

export type UserTraits = z.infer<typeof userTraitsSchema>

export interface VoterWithTraits {
  userId: string
  traits?: UserTraits
}

export interface RevenueImpactResult {
  totalMrr: number
  payingVotersCount: number
  totalVotersCount: number
  formattedMrr: string
}

export function calculateRevenueImpact(
  voters: VoterWithTraits[],
): RevenueImpactResult {
  let totalMrr = 0
  let payingVotersCount = 0

  for (const voter of voters) {
    const mrr = voter.traits?.mrr ?? 0
    if (mrr > 0) {
      totalMrr += mrr
      payingVotersCount += 1
    }
  }

  return {
    totalMrr,
    payingVotersCount,
    totalVotersCount: voters.length,
    formattedMrr: `$${totalMrr.toLocaleString("en-US")}`,
  }
}
