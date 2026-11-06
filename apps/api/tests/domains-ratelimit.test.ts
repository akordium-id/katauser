import { describe, it, expect } from "vitest"
import { app } from "../src/app"

describe("Domain Verification & Rate Limiting API Routes", () => {
  it("GET /api/v1/domains/verify checks CNAME configuration", async () => {
    const res = await app.request(
      "/api/v1/domains/verify?domain=feedback.acme.com&workspaceSlug=acme-corp",
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.expectedCname).toBe("cname.katauser.com")
    expect(typeof data.verified).toBe("boolean")
  })

  it("GET /api/v1/domains/verify rejects invalid domain input", async () => {
    const res = await app.request(
      "/api/v1/domains/verify?domain=not-a-domain!&workspaceSlug=acme-corp",
    )
    expect(res.status).toBe(400)
  })

  it("rate limits repetitive voting requests from same IP", async () => {
    const testIp = "198.51.100.42"

    // Send rapid requests beyond test threshold
    const responses = []
    for (let i = 0; i < 7; i++) {
      const res = await app.request("/api/v1/posts/post_rate_test/vote", {
        method: "POST",
        headers: {
          "CF-Connecting-IP": testIp,
        },
      })
      responses.push(res.status)
    }

    // At least the later requests should be rate limited (429)
    expect(responses).toContain(429)
  })
})
