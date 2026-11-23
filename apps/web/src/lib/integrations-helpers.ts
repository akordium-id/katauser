/**
 * Format MRR impact badge string
 */
export function formatRevenueBadge(totalMrr?: number): string {
  if (!totalMrr || totalMrr <= 0) return ""
  return `$${totalMrr.toLocaleString("en-US")}/mo MRR`
}

/**
 * Validate Webhook URLs for Slack or Discord
 */
export function validateWebhookUrl(
  url: string,
  provider: "slack" | "discord",
): { valid: boolean; error?: string } {
  if (!url || url.trim() === "") {
    return { valid: true } // optional empty allowed
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") {
      return {
        valid: false,
        error: "URL Webhook wajib menggunakan protokol HTTPS",
      }
    }

    if (provider === "slack" && !parsed.hostname.includes("slack.com")) {
      return {
        valid: false,
        error: "URL harus berasal dari domain hooks.slack.com",
      }
    }

    if (provider === "discord" && !parsed.hostname.includes("discord.com")) {
      return {
        valid: false,
        error: "URL harus berasal dari domain discord.com",
      }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: "Format URL tidak valid" }
  }
}

/**
 * Validate Linear Personal API Key format
 */
export function validateLinearApiKey(key: string): {
  valid: boolean
  error?: string
} {
  if (!key || key.trim() === "") {
    return { valid: false, error: "API Key Linear wajib diisi" }
  }

  const clean = key.trim()
  if (clean.length < 10) {
    return { valid: false, error: "API Key Linear terlalu pendek" }
  }

  if (!clean.startsWith("lin_api_")) {
    return {
      valid: false,
      error: "Format API Key tidak valid (harus diawali 'lin_api_')",
    }
  }

  return { valid: true }
}

/**
 * Format Linear issue identifier to uppercase
 */
export function formatLinearIdentifier(key: string): string {
  if (!key) return ""
  return key.trim().toUpperCase()
}

/**
 * Return Linear priority label and badge colors
 */
export function getLinearPriorityLabel(priority: number): {
  label: string
  color: string
} {
  switch (priority) {
    case 1:
      return { label: "Urgent", color: "badge-error" }
    case 2:
      return { label: "High", color: "badge-warning" }
    case 3:
      return { label: "Medium", color: "badge-info" }
    case 4:
      return { label: "Low", color: "badge-ghost" }
    case 0:
    default:
      return { label: "No priority", color: "badge-ghost" }
  }
}
