import { z } from "zod"

const DOMAIN_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

export const domainVerifySchema = z.object({
  domain: z
    .string()
    .trim()
    .regex(
      DOMAIN_REGEX,
      "Format domain tidak valid (contoh: feedback.acme.com)",
    ),
  workspaceSlug: z.string().min(1, "Workspace slug wajib diisi"),
})

export type DomainVerifyInput = z.infer<typeof domainVerifySchema>

/**
 * Strips protocols, ports, trailing paths, and normalizes domain string
 */
export function sanitizeDomain(input: string): string {
  let cleaned = input.trim().toLowerCase()
  cleaned = cleaned.replace(/^https?:\/\//, "")
  cleaned = cleaned.split("/")[0]
  cleaned = cleaned.split(":")[0]
  return cleaned
}

/**
 * Returns whether a domain is an apex domain (e.g. acme.com) or a subdomain (e.g. feedback.acme.com)
 */
export function isApexOrSubdomain(domain: string): "apex" | "subdomain" {
  const parts = sanitizeDomain(domain).split(".")
  return parts.length <= 2 ? "apex" : "subdomain"
}
