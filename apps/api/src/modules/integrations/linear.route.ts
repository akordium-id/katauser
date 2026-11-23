import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import {
  saveLinearIntegrationSchema,
  createLinearIssueSchema,
  linkLinearIssueSchema,
  type LinearTeam,
  type LinearIssueResult,
  type WebhookEvent,
} from "@katauser/shared"
import { LinearProvider } from "./providers/linear.provider"
import { handleLinearWebhook } from "./linear-webhook"
import { sendVoterNotificationEmail } from "../../services/email-notifier"
import {
  getPostRecord,
  updatePostRecordStatus,
  getVotersForPost,
} from "../feedback/posts.route"
import { getWorkspaceWebhookConfig } from "./integrations.route"
import { dispatchWebhookEvent } from "./webhook-dispatcher"

interface StoredLinearIntegration {
  apiKey: string
  webhookSecret: string
  defaultTeamId?: string
  organizationName?: string
  isActive: boolean
}

export interface StoredPostIssue {
  id: string
  postId: string
  workspaceSlug: string
  provider: string
  externalIssueId: string
  issueIdentifier: string
  issueUrl: string
  issueTitle: string
  issueStatus: string
  createdAt: string
}

// In-memory fallback stores for testing & isolated run
const integrationsStore: Record<string, StoredLinearIntegration> = {}
export const postIssuesStore: StoredPostIssue[] = []

export function setLinearIntegrationForWorkspace(
  workspaceSlug: string,
  integration: StoredLinearIntegration,
) {
  integrationsStore[workspaceSlug] = integration
}

export function getLinearIntegrationForWorkspace(workspaceSlug: string) {
  return integrationsStore[workspaceSlug]
}

const linearProvider = new LinearProvider()

export const linearRoute = new Hono()
  // 1. Get Linear integration status for workspace
  .get("/workspaces/:slug/integrations/linear", (c) => {
    const slug = c.req.param("slug")
    const integration = integrationsStore[slug]
    const baseUrl = process.env.PUBLIC_APP_URL || "https://katauser.com"
    const webhookUrl = `${baseUrl}/api/v1/integrations/linear/webhook/${slug}`

    if (!integration || !integration.isActive) {
      return c.json({
        success: true,
        connected: false,
        webhookUrl,
      })
    }

    return c.json({
      success: true,
      connected: true,
      organizationName: integration.organizationName || "Linear Workspace",
      defaultTeamId: integration.defaultTeamId,
      webhookUrl,
    })
  })

  // 2. Test Linear API key connection and list teams
  .post(
    "/workspaces/:slug/integrations/linear/test",
    zValidator(
      "json",
      z.object({
        apiKey: z.string().min(1, "API Key wajib diisi"),
      }),
      (result, c) => {
        if (!result.success) {
          return c.json({ success: false, errors: result.error.errors }, 400)
        }
      },
    ),
    async (c) => {
      const { apiKey } = c.req.valid("json")
      const testResult = await linearProvider.testConnection(apiKey)

      if (!testResult.success) {
        return c.json(
          {
            success: false,
            message: testResult.error || "Gagal menghubungi Linear API",
          },
          400,
        )
      }

      let teams: LinearTeam[] = []
      try {
        teams = await linearProvider.listTeams(apiKey)
      } catch {
        // keep empty list if listing fails
      }

      return c.json({
        success: true,
        organizationName: testResult.organizationName,
        teams,
      })
    },
  )

  // 3. Save Linear integration credentials
  .post(
    "/workspaces/:slug/integrations/linear",
    zValidator("json", saveLinearIntegrationSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400)
      }
    }),
    async (c) => {
      const slug = c.req.param("slug")
      const data = c.req.valid("json")

      // Verify API key before saving
      const testResult = await linearProvider.testConnection(data.apiKey)
      if (!testResult.success) {
        return c.json(
          {
            success: false,
            message: testResult.error || "API Key Linear tidak valid",
          },
          400,
        )
      }

      const organizationName = testResult.organizationName || "Linear Workspace"

      integrationsStore[slug] = {
        apiKey: data.apiKey,
        webhookSecret: data.webhookSecret,
        defaultTeamId: data.defaultTeamId,
        organizationName,
        isActive: true,
      }

      return c.json({
        success: true,
        message: "Integrasi Linear berhasil disimpan",
        integration: {
          connected: true,
          organizationName,
          defaultTeamId: data.defaultTeamId,
        },
      })
    },
  )

  // 4. Disconnect Linear integration
  .delete("/workspaces/:slug/integrations/linear", (c) => {
    const slug = c.req.param("slug")
    delete integrationsStore[slug]
    return c.json({
      success: true,
      message: "Integrasi Linear telah diputuskan",
    })
  })

  // 5. Get issues linked to a post
  .get("/workspaces/:slug/posts/:postId/issues", (c) => {
    const slug = c.req.param("slug")
    const postId = c.req.param("postId")
    const issues = postIssuesStore.filter(
      (item) => item.workspaceSlug === slug && item.postId === postId,
    )
    return c.json({ success: true, issues })
  })

  // 6. Create a new Linear issue from a post
  .post(
    "/workspaces/:slug/posts/:postId/issues/linear",
    zValidator("json", createLinearIssueSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400)
      }
    }),
    async (c) => {
      const slug = c.req.param("slug")
      const postId = c.req.param("postId")
      const data = c.req.valid("json")

      const integration = integrationsStore[slug]
      if (!integration || !integration.isActive) {
        return c.json(
          {
            success: false,
            message: "Integrasi Linear belum dihubungkan pada workspace ini",
          },
          400,
        )
      }

      const baseUrl = process.env.PUBLIC_APP_URL || "https://katauser.com"
      const postUrl = `${baseUrl}/dashboard/${slug}/posts/${postId}`

      let issueResult: LinearIssueResult
      try {
        issueResult = await linearProvider.createIssue(integration.apiKey, {
          teamId: data.teamId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          postUrl,
        })
      } catch (err: any) {
        return c.json(
          {
            success: false,
            message: err.message || "Gagal membuat issue di Linear",
          },
          400,
        )
      }

      const newPostIssue: StoredPostIssue = {
        id: "piss_" + Math.random().toString(36).substring(2, 10),
        postId,
        workspaceSlug: slug,
        provider: "linear",
        externalIssueId: issueResult.id,
        issueIdentifier: issueResult.identifier,
        issueUrl: issueResult.url,
        issueTitle: issueResult.title,
        issueStatus: issueResult.status,
        createdAt: new Date().toISOString(),
      }

      postIssuesStore.push(newPostIssue)

      return c.json({ success: true, issue: newPostIssue })
    },
  )

  // 7. Link an existing Linear issue
  .post(
    "/workspaces/:slug/posts/:postId/issues/linear/link",
    zValidator("json", linkLinearIssueSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400)
      }
    }),
    async (c) => {
      const slug = c.req.param("slug")
      const postId = c.req.param("postId")
      const data = c.req.valid("json")

      const integration = integrationsStore[slug]
      if (!integration || !integration.isActive) {
        return c.json(
          {
            success: false,
            message: "Integrasi Linear belum dihubungkan pada workspace ini",
          },
          400,
        )
      }

      let issueResult: LinearIssueResult
      try {
        issueResult = await linearProvider.getIssue(
          integration.apiKey,
          data.issueIdOrKey,
        )
      } catch (err: any) {
        return c.json(
          {
            success: false,
            message:
              err.message ||
              `Issue ${data.issueIdOrKey} tidak ditemukan di Linear`,
          },
          400,
        )
      }

      const newPostIssue: StoredPostIssue = {
        id: "piss_" + Math.random().toString(36).substring(2, 10),
        postId,
        workspaceSlug: slug,
        provider: "linear",
        externalIssueId: issueResult.id,
        issueIdentifier: issueResult.identifier,
        issueUrl: issueResult.url,
        issueTitle: issueResult.title,
        issueStatus: issueResult.status,
        createdAt: new Date().toISOString(),
      }

      postIssuesStore.push(newPostIssue)

      return c.json({ success: true, issue: newPostIssue })
    },
  )

  // 8. Unlink issue from post with workspace and post ownership validation
  .delete("/workspaces/:slug/posts/:postId/issues/:issueId", (c) => {
    const slug = c.req.param("slug")
    const postId = c.req.param("postId")
    const issueId = c.req.param("issueId")

    const index = postIssuesStore.findIndex(
      (item) =>
        item.id === issueId &&
        item.workspaceSlug === slug &&
        item.postId === postId,
    )

    if (index === -1) {
      return c.json(
        { success: false, message: "Issue tidak ditemukan pada post ini" },
        404,
      )
    }

    postIssuesStore.splice(index, 1)
    return c.json({ success: true, message: "Issue berhasil di-unlink" })
  })

  // 9. Inbound Webhook from Linear
  .post("/integrations/linear/webhook/:workspaceSlug", async (c) => {
    const workspaceSlug = c.req.param("workspaceSlug")
    const signature =
      c.req.header("linear-signature") || c.req.header("Linear-Signature")
    const rawBody = await c.req.text()

    const integration = integrationsStore[workspaceSlug]
    // Critical 1.1: Do NOT use hardcoded fallback secret!
    if (!integration || !integration.isActive || !integration.webhookSecret) {
      return c.json(
        {
          success: false,
          error: "Integrasi Linear belum dikonfigurasi untuk workspace ini",
        },
        401,
      )
    }

    const secret = integration.webhookSecret

    const repo = {
      getPostIssueByExternalId: async (
        provider: string,
        externalId: string,
      ) => {
        return (
          postIssuesStore.find(
            (i) =>
              i.workspaceSlug === workspaceSlug &&
              i.provider === provider &&
              i.externalIssueId === externalId,
          ) || null
        )
      },
      updatePostIssueStatus: async (id: string, status: string) => {
        const item = postIssuesStore.find((i) => i.id === id)
        if (item) {
          item.issueStatus = status
        }
      },
    }

    const feedbackRepo = {
      getPostById: async (id: string) => {
        const post = getPostRecord(id)
        if (post) return post
        return {
          id,
          title: "Feature Request",
          status: "in_progress",
        }
      },
      updatePostStatus: async (id: string, status: string) => {
        updatePostRecordStatus(id, status)
        return true
      },
    }

    const notifyVoters = async (postId: string) => {
      const post = getPostRecord(postId)
      const postTitle = post?.title || "Feature Request"
      const voters = getVotersForPost(postId)

      if (voters.length > 0) {
        for (const voter of voters) {
          if (voter.userEmail) {
            await sendVoterNotificationEmail({
              recipientEmail: voter.userEmail,
              recipientName: "Voter",
              workspaceName: workspaceSlug,
              postTitle,
              newStatus: "shipped",
              postUrl: `https://katauser.com/b/${workspaceSlug}/posts/${postId}`,
            }).catch(() => {})
          }
        }
      } else {
        // Fallback for notifications if no direct voters registered
        await sendVoterNotificationEmail({
          recipientEmail: "demo@katauser.com",
          recipientName: "Demo Subscriber",
          workspaceName: workspaceSlug,
          postTitle,
          newStatus: "shipped",
          postUrl: `https://katauser.com/b/${workspaceSlug}/posts/${postId}`,
        }).catch(() => {})
      }

      // Dispatch outbound webhook to Slack/Discord if configured
      const whConfig = getWorkspaceWebhookConfig(workspaceSlug)
      if (whConfig) {
        const outboundEvent: WebhookEvent = {
          event: "post.created",
          workspaceSlug,
          timestamp: new Date().toISOString(),
          data: {
            title: `[Completed via Linear] ${postTitle}`,
            content: `Fitur "${postTitle}" telah selesai dikerjakan di Linear dan statusnya berganti menjadi Completed.`,
            url: `https://katauser.com/b/${workspaceSlug}/posts/${postId}`,
          },
        }
        await dispatchWebhookEvent(whConfig, outboundEvent).catch(() => {})
      }
    }

    const result = await handleLinearWebhook({
      rawBody,
      signature,
      secret,
      repo,
      feedbackRepo,
      notifyVoters,
    })

    if (!result.success && result.status) {
      return c.json(
        { success: false, error: result.error },
        result.status as any,
      )
    }

    return c.json(result)
  })
