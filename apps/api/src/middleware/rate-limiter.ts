import type { Context, Next } from "hono"

export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp.trim()

  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return "127.0.0.1"
}

export function createRateLimiter(options: { max: number; windowMs: number }) {
  const ipHits = new Map<string, { count: number; resetAt: number }>()

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c.req.raw)
    const now = Date.now()
    const entry = ipHits.get(ip)

    if (!entry || now > entry.resetAt) {
      ipHits.set(ip, { count: 1, resetAt: now + options.windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > options.max) {
      return c.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        429,
      )
    }

    return next()
  }
}
