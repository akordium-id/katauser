import { Hono } from "hono"
import { cors } from "hono/cors"
import { healthRoute } from "./modules/health/health.route"
import { workspacesRoute } from "./modules/workspaces/workspaces.route"
import { boardsRoute } from "./modules/feedback/boards.route"
import { postsRoute } from "./modules/feedback/posts.route"
import { roadmapRoute } from "./modules/roadmap/roadmap.route"
import { changelogRoute } from "./modules/changelog/changelog.route"
import { widgetRoute } from "./modules/widget/widget.route"
import { chatRoute } from "./modules/chat/chat.route"
import { domainsRoute } from "./modules/domains/domains.route"
import { integrationsRoute } from "./modules/integrations/integrations.route"
import { knowledgeRoute } from "./modules/ai/knowledge.route"

export const app = new Hono()
  .use(
    "*",
    cors({
      origin: (origin) => origin ?? "*",
      allowHeaders: [
        "Content-Type",
        "Authorization",
        "X-Workspace-Slug",
        "X-User-Id",
      ],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  )
  .basePath("/api/v1")
  .route("/health", healthRoute)
  .route("/workspaces", workspacesRoute)
  .route("/", boardsRoute)
  .route("/", postsRoute)
  .route("/", roadmapRoute)
  .route("/", changelogRoute)
  .route("/", widgetRoute)
  .route("/", chatRoute)
  .route("/", domainsRoute)
  .route("/", integrationsRoute)
  .route("/", knowledgeRoute)

export type AppType = typeof app
