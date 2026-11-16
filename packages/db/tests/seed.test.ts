import { describe, it, expect } from "vitest"
import { scryptSync, timingSafeEqual } from "node:crypto"
import {
  SEED_ADMIN_USER,
  SEED_WORKSPACE,
  SEED_WORKSPACE_MEMBER,
  SEED_END_USERS,
  SEED_BOARDS,
  SEED_POSTS,
  SEED_VOTES,
  SEED_COMMENTS,
  SEED_CHANGELOG,
  hashSeedPassword,
} from "../src/seed-data"

describe("Database Seed Data Integrity", () => {
  it("generates a verifiable scrypt password hash for admin user", () => {
    const combinedHash = hashSeedPassword(SEED_ADMIN_USER.plainPassword)
    expect(combinedHash).toContain(":")

    const [salt, key] = combinedHash.split(":")
    const computedKey = scryptSync(SEED_ADMIN_USER.plainPassword, salt, 64)
    const expectedKey = Buffer.from(key, "hex")

    expect(timingSafeEqual(computedKey, expectedKey)).toBe(true)
  })

  it("ensures admin and workspace relationship integrity", () => {
    expect(SEED_WORKSPACE.slug).toBe("acme")
    expect(SEED_WORKSPACE_MEMBER.workspaceId).toBe(SEED_WORKSPACE.id)
    expect(SEED_WORKSPACE_MEMBER.userId).toBe(SEED_ADMIN_USER.id)
    expect(SEED_WORKSPACE_MEMBER.role).toBe("owner")
  })

  it("includes valid end-user personas with MRR metadata", () => {
    expect(SEED_END_USERS.length).toBeGreaterThanOrEqual(3)

    for (const user of SEED_END_USERS) {
      expect(user.workspaceId).toBe(SEED_WORKSPACE.id)
      expect(user.email).toContain("@")
      expect(user.metadata.mrr).toBeTypeOf("number")
      expect(user.metadata.mrr).toBeGreaterThan(0)
    }
  })

  it("contains valid boards scoped to demo workspace", () => {
    expect(SEED_BOARDS.length).toBe(2)
    const boardSlugs = SEED_BOARDS.map((b) => b.slug)
    expect(boardSlugs).toContain("fitur")
    expect(boardSlugs).toContain("kendala")

    for (const board of SEED_BOARDS) {
      expect(board.workspaceId).toBe(SEED_WORKSPACE.id)
    }
  })

  it("validates feedback posts status and foreign key relations", () => {
    const validStatuses = [
      "pending",
      "under_review",
      "planned",
      "in_progress",
      "completed",
      "closed",
    ]
    const validBoardIds = new Set(SEED_BOARDS.map((b) => b.id))
    const validEndUserIds = new Set(SEED_END_USERS.map((eu) => eu.id))

    expect(SEED_POSTS.length).toBeGreaterThanOrEqual(5)

    for (const post of SEED_POSTS) {
      expect(post.workspaceId).toBe(SEED_WORKSPACE.id)
      expect(validBoardIds.has(post.boardId)).toBe(true)
      expect(validStatuses).toContain(post.status)
      expect(post.votesCount).toBeGreaterThanOrEqual(0)
      expect(post.commentsCount).toBeGreaterThanOrEqual(0)

      if (post.endUserId) {
        expect(validEndUserIds.has(post.endUserId)).toBe(true)
      }
    }
  })

  it("verifies vote records point to existing posts and end users", () => {
    const postIds = new Set(SEED_POSTS.map((p) => p.id))
    const endUserIds = new Set(SEED_END_USERS.map((eu) => eu.id))

    for (const vote of SEED_VOTES) {
      expect(vote.workspaceId).toBe(SEED_WORKSPACE.id)
      expect(postIds.has(vote.postId)).toBe(true)
      expect(endUserIds.has(vote.endUserId)).toBe(true)
    }
  })

  it("verifies comments and changelog associations", () => {
    const postIds = new Set(SEED_POSTS.map((p) => p.id))

    for (const comment of SEED_COMMENTS) {
      expect(comment.workspaceId).toBe(SEED_WORKSPACE.id)
      expect(postIds.has(comment.postId)).toBe(true)
      expect(comment.content.length).toBeGreaterThan(5)
    }

    expect(SEED_CHANGELOG.workspaceId).toBe(SEED_WORKSPACE.id)
    for (const linkedId of SEED_CHANGELOG.linkedPostIds) {
      expect(postIds.has(linkedId)).toBe(true)
    }
  })
})
