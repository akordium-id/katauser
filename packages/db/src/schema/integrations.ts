import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { workspaces } from "./workspaces"
import { posts } from "./feedback"

// 1. Kredensial dan konfigurasi provider per workspace
export const workspaceIntegrations = pgTable(
  "workspace_integrations",
  {
    id: text("id").primaryKey(), // prefix 'wint_'
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'linear' | 'github'
    apiKey: text("api_key").notNull(),
    webhookSecret: text("webhook_secret").notNull(),
    config: jsonb("config").default({}).notNull(), // { defaultTeamId, defaultTeamKey, organizationName }
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspace_provider_unique").on(
      table.workspaceId,
      table.provider,
    ),
  ],
)

// 2. Relasi antara Feedback Post dengan External Issue Tracker
export const postIssues = pgTable(
  "post_issues",
  {
    id: text("id").primaryKey(), // prefix 'piss_'
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'linear'
    externalIssueId: text("external_issue_id").notNull(), // Linear UUID untuk pencocokan webhook
    issueIdentifier: text("issue_identifier").notNull(), // misal 'ENG-142'
    issueUrl: text("issue_url").notNull(), // URL langsung ke Linear
    issueTitle: text("issue_title").notNull(),
    issueStatus: text("issue_status").notNull(), // misal 'In Progress', 'Done'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("post_provider_issue_unique").on(
      table.postId,
      table.provider,
      table.externalIssueId,
    ),
    index("post_issues_external_id_idx").on(
      table.provider,
      table.externalIssueId,
    ),
  ],
)
