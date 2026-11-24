import { describe, it, expect, vi } from "vitest"
import { createHmac } from "node:crypto"
import {
  verifyLinearWebhookSignature,
  handleLinearWebhook,
} from "../src/modules/integrations/linear-webhook"

describe("Linear Webhook Verification & Handler", () => {
  const secret = "whsec_test_secret_123"
  const rawBody = JSON.stringify({
    action: "update",
    type: "Issue",
    data: {
      id: "lin_issue_123",
      identifier: "ENG-142",
      title: "CSV Export",
      state: { name: "Done", type: "completed" },
    },
  })

  it("should return true for valid HMAC signature and false for tampered signature", () => {
    const validSignature = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex")
    expect(verifyLinearWebhookSignature(rawBody, validSignature, secret)).toBe(
      true,
    )
    expect(
      verifyLinearWebhookSignature(rawBody, "invalid_signature", secret),
    ).toBe(false)
    expect(verifyLinearWebhookSignature(rawBody, "", secret)).toBe(false)
  })

  it("should reject invalid signature with 401 status", async () => {
    const mockRepo: any = {}
    const mockFeedbackRepo: any = {}

    const result = await handleLinearWebhook({
      rawBody,
      signature: "invalid_sig",
      secret,
      repo: mockRepo,
      feedbackRepo: mockFeedbackRepo,
    })

    expect(result.success).toBe(false)
    expect(result.status).toBe(401)
  })

  it("should update post status to completed and trigger voter notifier on completed state", async () => {
    const mockRepo = {
      getPostIssueByExternalId: vi.fn().mockResolvedValue({
        id: "piss_1",
        postId: "post_42",
        workspaceId: "ws_acme",
        issueStatus: "In Progress",
      }),
      updatePostIssueStatus: vi.fn().mockResolvedValue(true),
    }

    const mockFeedbackRepo = {
      getPostById: vi.fn().mockResolvedValue({
        id: "post_42",
        title: "CSV Export",
        status: "in_progress",
      }),
      updatePostStatus: vi.fn().mockResolvedValue(true),
    }

    const mockVoterNotifier = vi.fn().mockResolvedValue(true)

    const result = await handleLinearWebhook({
      rawBody,
      signature: createHmac("sha256", secret).update(rawBody).digest("hex"),
      secret,
      repo: mockRepo as any,
      feedbackRepo: mockFeedbackRepo as any,
      notifyVoters: mockVoterNotifier,
    })

    expect(result.success).toBe(true)
    expect(mockRepo.updatePostIssueStatus).toHaveBeenCalledWith(
      "piss_1",
      "Done",
    )
    expect(mockFeedbackRepo.updatePostStatus).toHaveBeenCalledWith(
      "post_42",
      "completed",
    )
    expect(mockVoterNotifier).toHaveBeenCalledWith("post_42")
  })

  it("should be idempotent: do not notify voters if post is already completed", async () => {
    const mockRepo = {
      getPostIssueByExternalId: vi.fn().mockResolvedValue({
        id: "piss_1",
        postId: "post_42",
        issueStatus: "Done",
      }),
      updatePostIssueStatus: vi.fn(),
    }
    const mockFeedbackRepo = {
      getPostById: vi.fn().mockResolvedValue({
        id: "post_42",
        status: "completed", // Already completed!
      }),
      updatePostStatus: vi.fn(),
    }
    const mockVoterNotifier = vi.fn()

    const result = await handleLinearWebhook({
      rawBody,
      signature: createHmac("sha256", secret).update(rawBody).digest("hex"),
      secret,
      repo: mockRepo as any,
      feedbackRepo: mockFeedbackRepo as any,
      notifyVoters: mockVoterNotifier,
    })

    expect(result.success).toBe(true)
    expect(mockVoterNotifier).not.toHaveBeenCalled()
  })

  it("should gracefully handle unlinked issue event", async () => {
    const mockRepo = {
      getPostIssueByExternalId: vi.fn().mockResolvedValue(null),
    }
    const mockFeedbackRepo = {
      updatePostStatus: vi.fn(),
    }

    const result = await handleLinearWebhook({
      rawBody,
      signature: createHmac("sha256", secret).update(rawBody).digest("hex"),
      secret,
      repo: mockRepo as any,
      feedbackRepo: mockFeedbackRepo as any,
    })

    expect(result.success).toBe(true)
    expect(result.ignored).toBe(true)
    expect(mockFeedbackRepo.updatePostStatus).not.toHaveBeenCalled()
  })
})
