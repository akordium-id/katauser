import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { createChangelogSchema } from "@katauser/shared"

export const changelogsStore: Array<{
  id: string
  workspaceId: string
  title: string
  slug: string
  content: string
  postIds?: string[]
  publishedAt: string
  createdAt: string
}> = []

export const changelogRoute = new Hono()
  .get("/workspaces/:slug/changelogs/latest", (c) => {
    const slug = c.req.param("slug")
    const sinceParam = c.req.query("since")
    const now = new Date().toISOString()

    const filtered = changelogsStore
      .filter(
        (ch) =>
          ch.workspaceId === slug && ch.publishedAt && ch.publishedAt <= now,
      )
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )

    if (filtered.length === 0) {
      return c.json({
        success: true,
        latest: null,
        unreadCount: 0,
        hasUnread: false,
      })
    }

    const latest = filtered[0]
    let unreadCount = 0

    if (sinceParam && sinceParam !== "undefined" && sinceParam !== "null") {
      const sinceDate = new Date(sinceParam)
      if (!isNaN(sinceDate.getTime())) {
        unreadCount = filtered.filter(
          (ch) => new Date(ch.publishedAt).getTime() > sinceDate.getTime(),
        ).length
      } else {
        unreadCount = Math.min(filtered.length, 5)
      }
    } else {
      unreadCount = Math.min(filtered.length, 5)
    }

    return c.json({
      success: true,
      latest,
      unreadCount,
      hasUnread: unreadCount > 0,
    })
  })
  .get("/workspaces/:slug/changelogs", (c) => {
    const slug = c.req.param("slug")
    const now = new Date().toISOString()
    const filtered = changelogsStore.filter(
      (ch) =>
        ch.workspaceId === slug && (!ch.publishedAt || ch.publishedAt <= now),
    )
    return c.json({
      success: true,
      changelogs: filtered,
    })
  })
  .post(
    "/workspaces/:slug/changelogs",
    zValidator("json", createChangelogSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400)
      }
    }),
    async (c) => {
      const slug = c.req.param("slug")
      const data = c.req.valid("json")

      const newChangelog = {
        id: "ch_" + Math.random().toString(36).substring(2, 10),
        workspaceId: slug,
        title: data.title,
        slug: data.slug,
        content: data.content,
        postIds: data.postIds ?? [],
        publishedAt: data.publishedAt ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      changelogsStore.push(newChangelog)

      return c.json(
        {
          success: true,
          changelog: newChangelog,
        },
        201,
      )
    },
  )
