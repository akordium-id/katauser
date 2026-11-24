import { createHmac, timingSafeEqual } from "node:crypto"

export function verifyLinearWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) {
    return false
  }

  try {
    const computed = createHmac("sha256", secret).update(rawBody).digest("hex")
    const computedBuf = Buffer.from(computed, "utf8")
    const headerBuf = Buffer.from(signatureHeader, "utf8")

    if (computedBuf.length !== headerBuf.length) {
      return false
    }

    return timingSafeEqual(computedBuf, headerBuf)
  } catch {
    return false
  }
}

export interface LinearWebhookPayload {
  action: string
  type: string
  data: {
    id: string
    identifier: string
    title: string
    state?: {
      id?: string
      name: string
      type: string // 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled'
    }
  }
}

export async function handleLinearWebhook(params: {
  rawBody: string
  signature: string | undefined
  secret: string
  repo: {
    getPostIssueByExternalId: (
      provider: string,
      externalIssueId: string,
    ) => Promise<any>
    updatePostIssueStatus: (id: string, issueStatus: string) => Promise<any>
  }
  feedbackRepo: {
    getPostById: (id: string) => Promise<any>
    updatePostStatus: (id: string, status: string) => Promise<any>
  }
  notifyVoters?: (postId: string) => Promise<any>
}): Promise<{
  success: boolean
  status?: number
  error?: string
  ignored?: boolean
  postUpdated?: boolean
}> {
  const { rawBody, signature, secret, repo, feedbackRepo, notifyVoters } =
    params

  if (!verifyLinearWebhookSignature(rawBody, signature, secret)) {
    return {
      success: false,
      status: 401,
      error: "Invalid webhook signature",
    }
  }

  let payload: LinearWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return {
      success: false,
      status: 400,
      error: "Invalid JSON payload",
    }
  }

  if (payload.type !== "Issue" || payload.action !== "update") {
    return {
      success: true,
      ignored: true,
    }
  }

  const issueData = payload.data
  if (!issueData?.id) {
    return {
      success: true,
      ignored: true,
    }
  }

  const link = await repo.getPostIssueByExternalId("linear", issueData.id)
  if (!link) {
    return {
      success: true,
      ignored: true,
    }
  }

  const stateName = issueData.state?.name ?? "Updated"
  const stateType = issueData.state?.type

  // Update status in post_issues
  await repo.updatePostIssueStatus(link.id, stateName)

  let postUpdated = false
  if (stateType === "completed") {
    const post = await feedbackRepo.getPostById(link.postId)
    if (post && post.status !== "completed") {
      await feedbackRepo.updatePostStatus(link.postId, "completed")
      postUpdated = true

      if (notifyVoters) {
        try {
          await notifyVoters(link.postId)
        } catch (err) {
          console.error("Failed to notify voters for post completion:", err)
        }
      }
    }
  }

  return {
    success: true,
    postUpdated,
  }
}
