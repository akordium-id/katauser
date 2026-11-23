import { describe, it, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { changelogRoute } from "../src/modules/changelog/changelog.route"

describe("Changelog Latest & Unread API", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono().route("/", changelogRoute)
  })

  it("returns latest changelog and unreadCount when releases exist", async () => {
    // 1. Create older release
    await app.request("/workspaces/acme/changelogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Release v1.0.0",
        slug: "v1-0-0",
        content: "Initial public launch",
        publishedAt: "2026-11-01T10:00:00.000Z",
      }),
    })

    // 2. Create newer release
    await app.request("/workspaces/acme/changelogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Release v1.1.0",
        slug: "v1-1-0",
        content: "Roadmap Kanban & Dark mode",
        publishedAt: "2026-11-20T10:00:00.000Z",
      }),
    })

    // 3. Query latest without since parameter (returns all published as unread)
    const resAll = await app.request("/workspaces/acme/changelogs/latest")
    expect(resAll.status).toBe(200)
    const dataAll = await resAll.json()
    expect(dataAll.success).toBe(true)
    expect(dataAll.latest).toBeDefined()
    expect(dataAll.latest.slug).toBe("v1-1-0")
    expect(dataAll.unreadCount).toBeGreaterThanOrEqual(2)
    expect(dataAll.hasUnread).toBe(true)

    // 4. Query with since = date between releases
    const resSince = await app.request(
      "/workspaces/acme/changelogs/latest?since=2026-11-15T00:00:00.000Z",
    )
    expect(resSince.status).toBe(200)
    const dataSince = await resSince.json()
    expect(dataSince.unreadCount).toBe(1)
    expect(dataSince.hasUnread).toBe(true)

    // 5. Query with since = date after latest release
    const resCaughtUp = await app.request(
      "/workspaces/acme/changelogs/latest?since=2026-11-23T00:00:00.000Z",
    )
    expect(resCaughtUp.status).toBe(200)
    const dataCaughtUp = await resCaughtUp.json()
    expect(dataCaughtUp.unreadCount).toBe(0)
    expect(dataCaughtUp.hasUnread).toBe(false)
  })

  it("returns latest null and unreadCount 0 when workspace has no changelogs", async () => {
    const res = await app.request(
      "/workspaces/empty_workspace/changelogs/latest",
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.latest).toBeNull()
    expect(data.unreadCount).toBe(0)
    expect(data.hasUnread).toBe(false)
  })
})
