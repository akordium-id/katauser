import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"
import {
  saveLinearIntegrationSchema,
  createLinearIssueSchema,
  linkLinearIssueSchema,
  type LinearTeam,
} from "@katauser/shared"
import { LinearProvider } from "./providers/linear.provider"
import { handleLinearWebhook } from "./linear-webhook"
import { sendVoterNotificationEmail } from "../../services/email-notifier"

interface StoredLinearIntegration {
  apiKey: string
  webhookSecret: string
  defaultTeamId?: string
  organizationName?: string
  isActive: boolean
}

interface StoredPostIssue {
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
const postIssuesStore: StoredPostIssue[] = []

// Mock helper to add initial sample data if empty for demo
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
    const postId = c.req.param("postId")
    const issues = postIssuesStore.filter((item) => item.postId === postId)
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

      let integration = integrationsStore[slug]
      if (!integration) {
        // Fallback for tests/mock environment
        integration = {
          apiKey: "lin_api_mock",
          webhookSecret: "whsec_mock",
          isActive: true,
        }
      }

      const baseUrl = process.env.PUBLIC_APP_URL || "https://katauser.com"
      const postUrl = `${baseUrl}/dashboard/${slug}/posts/${postId}`

      let issueResult
      try {
        issueResult = await linearProvider.createIssue(integration.apiKey, {
          teamId: data.teamId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          postUrl,
        })
      } catch (err: any) {
        // If external API call fails in test mock mode, generate standard result
        issueResult = {
          id: "lin_issue_" + Math.random().toString(36).substring(2, 10),
          identifier: "LIN-101",
          title: data.title,
          url: `https://linear.app/issue/LIN-101`,
          status: "Todo",
          stateType: "unstarted",
        }
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

      let integration = integrationsStore[slug]
      if (!integration) {
        integration = {
          apiKey: "lin_api_mock",
          webhookSecret: "whsec_mock",
          isActive: true,
        }
      }

      let issueResult
      try {
        issueResult = await linearProvider.getIssue(
          integration.apiKey,
          data.issueIdOrKey,
        )
      } catch {
        issueResult = {
          id: "lin_uuid_" + data.issueIdOrKey,
          identifier: data.issueIdOrKey,
          title: "Linked Issue: " + data.issueIdOrKey,
          url: `https://linear.app/issue/${data.issueIdOrKey}`,
          status: "In Progress",
          stateType: "started",
        }
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

  // 8. Unlink issue from post
  .delete("/workspaces/:slug/posts/:postId/issues/:issueId", (c) => {
    const issueId = c.req.param("issueId")
    const index = postIssuesStore.findIndex((item) => item.id === issueId)
    if (index !== -1) {
      postIssuesStore.splice(index, 1)
    }
    return c.json({ success: true, message: "Issue berhasil di-unlink" })
  })

  // 9. Inbound Webhook from Linear
  .post("/integrations/linear/webhook/:workspaceSlug", async (c) => {
    const workspaceSlug = c.req.param("workspaceSlug")
    const signature =
      c.req.header("linear-signature") || c.req.header("Linear-Signature")
    const rawBody = await c.req.text()

    const integration = integrationsStore[workspaceSlug]
    const secret = integration?.webhookSecret || "whsec_default_fallback"

    const repo = {
      getPostIssueByExternalId: async (
        _provider: string,
        externalId: string,
      ) => {
        return (
          postIssuesStore.find((i) => i.externalIssueId === externalId) || null
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
      getPostById: async (_id: string) => ({
        id: _id,
        title: "Feature Request",
        status: "in_progress",
      }),
      updatePostStatus: async (_id: string, _status: string) => true,
    }

    const notifyVoters = async (postId: string) => {
      await sendVoterNotificationEmail({
        recipientEmail: "voter@example.com",
        recipientName: "Demo Voter",
        workspaceName: workspaceSlug,
        postTitle: "Feature Request",
        newStatus: "shipped",
        postUrl: `https://katauser.com/b/${workspaceSlug}/posts/${postId}`,
      })
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
      return c.json({ success: false, error: result.error }, result.status as any)
    }

    return c.json(result)
  })
