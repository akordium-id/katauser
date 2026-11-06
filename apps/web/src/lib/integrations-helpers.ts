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
