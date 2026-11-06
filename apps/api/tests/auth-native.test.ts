import { describe, it, expect, vi, beforeEach } from "vitest"
import { app } from "../src/app"

describe("Native Authentication API Routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const testUser = {
    name: "Faiq Developer",
    email: "faiq@akordium.com",
    password: "SuperSecurePassword#2026",
  }

  it("registers a new user and returns user info with a session token", async () => {
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    })

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.user.email).toBe(testUser.email)
    expect(json.user.name).toBe(testUser.name)
    expect(json.token).toBeDefined()

    // Check Set-Cookie header contains session
    const setCookie = res.headers.get("set-cookie")
    expect(setCookie).toContain("katauser_session=")
  })

  it("rejects registration with duplicate email", async () => {
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    })

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.message).toContain("sudah terdaftar")
  })

  it("authenticates user with valid credentials and establishes session", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.user.email).toBe(testUser.email)
    expect(json.token).toBeDefined()
  })

  it("rejects login with incorrect password", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: "WrongPassword123",
      }),
    })

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
  })

  it("resolves authenticated user profile via GET /auth/me using session token", async () => {
    // 1. Login to get token
    const loginRes = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    })
    const loginJson = await loginRes.json()
    const token = loginJson.token

    // 2. Fetch /auth/me with Bearer token
    const meRes = await app.request("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(meRes.status).toBe(200)
    const meJson = await meRes.json()
    expect(meJson.success).toBe(true)
    expect(meJson.user.email).toBe(testUser.email)
  })
})
