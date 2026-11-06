export function parseSSEChunk(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith("data:")) return null

  const data = trimmed.replace(/^data:\s*/, "")
  if (data === "[DONE]") return null

  try {
    const parsed = JSON.parse(data)
    return parsed.text ?? null
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
