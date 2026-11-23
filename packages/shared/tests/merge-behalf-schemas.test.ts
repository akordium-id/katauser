import { describe, it, expect } from "vitest"
import {
  mergePostsSchema,
  voteOnBehalfSchema,
  POST_STATUSES,
} from "../src/schemas/feedback"

describe("Post Merging and Vote on Behalf Schemas", () => {
  it("includes 'merged' in POST_STATUSES", () => {
    expect(POST_STATUSES).toContain("merged")
  })

  it("validates mergePostsSchema", () => {
    expect(
      mergePostsSchema.safeParse({ targetPostId: "post_123" }).success,
    ).toBe(true)
    expect(mergePostsSchema.safeParse({ targetPostId: "" }).success).toBe(false)
    expect(mergePostsSchema.safeParse({}).success).toBe(false)
  })

  it("validates voteOnBehalfSchema", () => {
    const valid = {
      customerEmail: "user@example.com",
      customerName: "John Doe",
      company: "Acme Corp",
      mrr: 1500,
      internalNote: "Customer requested on sales demo",
    }
    expect(voteOnBehalfSchema.safeParse(valid).success).toBe(true)

    // Optional fields omitted
    expect(
      voteOnBehalfSchema.safeParse({ customerEmail: "user@example.com" })
        .success,
    ).toBe(true)

    // Invalid email
    expect(
      voteOnBehalfSchema.safeParse({ customerEmail: "invalid-email" }).success,
    ).toBe(false)

    // Negative MRR
    expect(
      voteOnBehalfSchema.safeParse({
        customerEmail: "user@example.com",
        mrr: -100,
      }).success,
    ).toBe(false)
  })
})
