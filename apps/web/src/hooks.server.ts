// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import {
  isRootDomain,
  resolveCustomDomain,
  rewritePathForCustomDomain,
} from "$lib/domain-router"

export const customDomainRouter: Handle = async ({ event, resolve }) => {
  const host = event.request.headers.get("host") || ""
  if (host && !isRootDomain(host)) {
    const slug = resolveCustomDomain(host)
    const newPath = rewritePathForCustomDomain(event.url.pathname, slug)
    if (newPath !== event.url.pathname) {
      event.url.pathname = newPath
    }
  }
  return resolve(event)
}

export const nativeAuthGuard: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get("katauser_session") || null
  event.locals.sessionToken = sessionToken

  if (sessionToken) {
    try {
      const meRes = await event.fetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      if (meRes.ok) {
        const { user } = await meRes.json()
        event.locals.user = user
      } else {
        event.locals.user = null
      }
    } catch {
      event.locals.user = null
    }
  } else {
    event.locals.user = null
  }

  return resolve(event)
}

export const handle: Handle = sequence(customDomainRouter, nativeAuthGuard)
