import { describe, it, expect, beforeEach } from "vitest"
import { Hono } from "hono"
import { postsRoute } from "../src/modules/feedback/posts.route"

describe("Posts Merging & Vote on Behalf API Routes", () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono().route("/", postsRoute)
  })

  it("POST /posts/:postId/merge returns 400 when merging post into itself", async () => {
    const res = await app.request("/posts/post_self/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPostId: "post_self" }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Cannot merge post into itself")
  })

  it("POST /posts/:postId/vote-on-behalf succeeds, increases votes count and MRR, and blocks duplicates with 409", async () => {
    // 1. Create a post
    const createRes = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "SSO SAML Integration",
        content: "Need Okta/SAML support for enterprise",
      }),
    })
    const { post } = await createRes.json()

    // 2. Vote on behalf
    const voteRes = await app.request(`/posts/${post.id}/vote-on-behalf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-team-user-id": "staff_lead_1",
      },
      body: JSON.stringify({
        customerEmail: "cto@megacorp.com",
        customerName: "Alice Megacorp",
        company: "MegaCorp Inc",
        mrr: 2500,
        internalNote: "Deal breaker for 200 seat enterprise contract",
      }),
    })
    expect(voteRes.status).toBe(201)
    const voteData = await voteRes.json()
    expect(voteData.success).toBe(true)
    expect(voteData.post.votesCount).toBe(1)
    expect(voteData.post.totalMrr).toBe(2500)
    expect(voteData.vote.customerEmail).toBe("cto@megacorp.com")
    expect(voteData.vote.votedByTeamUserId).toBe("staff_lead_1")

    // 3. Repeat vote with same customer returns 409 Conflict
    const dupRes = await app.request(`/posts/${post.id}/vote-on-behalf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-team-user-id": "staff_lead_1",
      },
      body: JSON.stringify({
        customerEmail: "cto@megacorp.com",
      }),
    })
    expect(dupRes.status).toBe(409)
    const dupData = await dupRes.json()
    expect(dupData.error).toContain("already voted")
  })

  it("POST /posts/:postId/merge merges source into target post with voter deduplication", async () => {
    // 1. Create target post
    const targetRes = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "Export to CSV",
        content: "Enable CSV download",
      }),
    })
    const { post: targetPost } = await targetRes.json()

    // 2. Create source post
    const sourceRes = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "Download data as Excel/CSV",
        content: "We need data export",
      }),
    })
    const { post: sourcePost } = await sourceRes.json()

    // 3. Vote on source post
    await app.request(`/posts/${sourcePost.id}/vote-on-behalf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail: "voter1@test.com",
        mrr: 400,
      }),
    })

    // 4. Vote on target post with the same voter (duplicate) and another voter
    await app.request(`/posts/${targetPost.id}/vote-on-behalf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail: "voter1@test.com",
        mrr: 400,
      }),
    })

    await app.request(`/posts/${sourcePost.id}/vote-on-behalf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerEmail: "unique_voter@test.com",
        mrr: 600,
      }),
    })

    // 5. Execute merge
    const mergeRes = await app.request(`/posts/${sourcePost.id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPostId: targetPost.id }),
    })
    expect(mergeRes.status).toBe(200)
    const mergeData = await mergeRes.json()
    expect(mergeData.success).toBe(true)
    // Target already had voter1 (400). Source had voter1 and unique_voter (600).
    // Transferred: only unique_voter.
    expect(mergeData.transferredVotesCount).toBe(1)
    expect(mergeData.targetPost.votesCount).toBe(2)
    expect(mergeData.targetPost.totalMrr).toBe(1000)

    // 6. Check source post status and mergedInto
    const getSourceRes = await app.request(`/posts/${sourcePost.id}`)
    const getSourceData = await getSourceRes.json()
    expect(getSourceData.post.status).toBe("merged")
    expect(getSourceData.post.mergedIntoPostId).toBe(targetPost.id)
    expect(getSourceData.mergedInto).toBeDefined()
    expect(getSourceData.mergedInto.id).toBe(targetPost.id)
  })

  it("POST /posts/:postId/merge rejects when target post is already merged", async () => {
    // Create posts
    const p1Res = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "Post 1",
        content: "Content 1",
      }),
    })
    const { post: p1 } = await p1Res.json()

    const p2Res = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "Post 2",
        content: "Content 2",
      }),
    })
    const { post: p2 } = await p2Res.json()

    const p3Res = await app.request("/boards/default_board/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: "default_board",
        title: "Post 3",
        content: "Content 3",
      }),
    })
    const { post: p3 } = await p3Res.json()

    // Merge p2 into p1
    await app.request(`/posts/${p2.id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPostId: p1.id }),
    })

    // Try merging p3 into p2 (which is already merged)
    const invalidMerge = await app.request(`/posts/${p3.id}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPostId: p2.id }),
    })
    expect(invalidMerge.status).toBe(400)
    const errBody = await invalidMerge.json()
    expect(errBody.error).toContain("already merged")
  })
})
