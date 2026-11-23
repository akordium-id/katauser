import { eq, and } from "drizzle-orm"
import { workspaceIntegrations, postIssues } from "../schema/integrations"

export class IntegrationRepository {
  constructor(private db: any) {}

  async upsertWorkspaceIntegration(params: {
    workspaceId: string
    provider: string
    apiKey: string
    webhookSecret: string
    config?: Record<string, any>
    isActive?: boolean
  }) {
    const id = "wint_" + Math.random().toString(36).substring(2, 12)
    const [integration] = await this.db
      .insert(workspaceIntegrations)
      .values({
        id,
        workspaceId: params.workspaceId,
        provider: params.provider,
        apiKey: params.apiKey,
        webhookSecret: params.webhookSecret,
        config: params.config ?? {},
        isActive: params.isActive ?? true,
      })
      .onConflictDoUpdate({
        target: [workspaceIntegrations.workspaceId, workspaceIntegrations.provider],
        set: {
          apiKey: params.apiKey,
          webhookSecret: params.webhookSecret,
          config: params.config ?? {},
          isActive: params.isActive ?? true,
          updatedAt: new Date(),
        },
      })
      .returning()

    return integration
  }

  async getWorkspaceIntegration(workspaceId: string, provider: string) {
    if (this.db.query?.workspaceIntegrations?.findFirst) {
      return await this.db.query.workspaceIntegrations.findFirst({
        where: and(
          eq(workspaceIntegrations.workspaceId, workspaceId),
          eq(workspaceIntegrations.provider, provider),
        ),
      })
    }
    const [integration] = await this.db
      .select()
      .from(workspaceIntegrations)
      .where(
        and(
          eq(workspaceIntegrations.workspaceId, workspaceId),
          eq(workspaceIntegrations.provider, provider),
        ),
      )
    return integration ?? null
  }

  async deleteWorkspaceIntegration(workspaceId: string, provider: string) {
    await this.db
      .delete(workspaceIntegrations)
      .where(
        and(
          eq(workspaceIntegrations.workspaceId, workspaceId),
          eq(workspaceIntegrations.provider, provider),
        ),
      )
  }

  async createPostIssue(params: {
    workspaceId: string
    postId: string
    provider: string
    externalIssueId: string
    issueIdentifier: string
    issueUrl: string
    issueTitle: string
    issueStatus: string
  }) {
    const id = "piss_" + Math.random().toString(36).substring(2, 12)
    const [link] = await this.db
      .insert(postIssues)
      .values({
        id,
        workspaceId: params.workspaceId,
        postId: params.postId,
        provider: params.provider,
        externalIssueId: params.externalIssueId,
        issueIdentifier: params.issueIdentifier,
        issueUrl: params.issueUrl,
        issueTitle: params.issueTitle,
        issueStatus: params.issueStatus,
      })
      .returning()

    return link
  }

  async getPostIssues(postId: string) {
    if (this.db.query?.postIssues?.findMany) {
      return await this.db.query.postIssues.findMany({
        where: eq(postIssues.postId, postId),
      })
    }
    return await this.db
      .select()
      .from(postIssues)
      .where(eq(postIssues.postId, postId))
  }

  async getPostIssueByExternalId(provider: string, externalIssueId: string) {
    if (this.db.query?.postIssues?.findFirst) {
      return await this.db.query.postIssues.findFirst({
        where: and(
          eq(postIssues.provider, provider),
          eq(postIssues.externalIssueId, externalIssueId),
        ),
      })
    }
    const [issue] = await this.db
      .select()
      .from(postIssues)
      .where(
        and(
          eq(postIssues.provider, provider),
          eq(postIssues.externalIssueId, externalIssueId),
        ),
      )
    return issue ?? null
  }

  async updatePostIssueStatus(id: string, issueStatus: string) {
    const [updated] = await this.db
      .update(postIssues)
      .set({
        issueStatus,
        updatedAt: new Date(),
      })
      .where(eq(postIssues.id, id))
      .returning()

    return updated
  }

  async deletePostIssue(id: string) {
    await this.db.delete(postIssues).where(eq(postIssues.id, id))
  }
}
