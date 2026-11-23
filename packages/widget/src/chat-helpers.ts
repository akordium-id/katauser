import type { JunoActionPayload } from "@katauser/shared"

export interface ChatMessage {
  id: string
  sender: "user" | "juno" | "human"
  text: string
  time: string
  action?: JunoActionPayload
  actionResolved?: boolean
}

export function parseSSEChunk(
  line: string,
): string | { text?: string; action?: JunoActionPayload } | null {
  const trimmed = line.trim()
  const data = trimmed.startsWith("data:")
    ? trimmed.replace(/^data:\s*/, "")
    : trimmed

  if (!data || data === "[DONE]") return null

  try {
    const parsed = JSON.parse(data)
    if (parsed.action) {
      return parsed
    }
    if (typeof parsed.text === "string") {
      return parsed.text
    }
    return null
  } catch {
    return null
  }
}

export function isEscalationRequested(text: string): boolean {
  return /manusia|orang asli|human|staf|agent|admin|bantuan langsung/i.test(
    text,
  )
}

export function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}
