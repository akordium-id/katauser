import type { VoterNotificationPayload } from "@katauser/shared"

/**
 * Render responsive transactional HTML email for voter status updates
 */
export function renderVoterStatusUpdateHtml(
  payload: VoterNotificationPayload,
): string {
  const {
    recipientName,
    workspaceName,
    postTitle,
    newStatus,
    postUrl,
    changelogUrl,
  } = payload

  const statusMap: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    planned: { label: "Planned", color: "#6366f1", bg: "#e0e7ff" },
    in_progress: { label: "In Progress", color: "#f59e0b", bg: "#fef3c7" },
    shipped: { label: "Shipped", color: "#10b981", bg: "#d1fae5" },
  }

  const statusInfo = statusMap[newStatus] || {
    label: newStatus,
    color: "#3b82f6",
    bg: "#dbeafe",
  }
  const targetUrl = changelogUrl || postUrl

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Update Fitur: ${postTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
      <h2 style="margin: 0; font-size: 18px; color: #0f172a;">${workspaceName}</h2>
    </div>
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 16px; font-size: 15px;">Halo ${recipientName || "Kawan"},</p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Kabar baik! Fitur yang pernah Anda dukung atau berikan upvote di <strong>${workspaceName}</strong> telah diperbarui statusnya:
      </p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
        <h3 style="margin: 0 0 8px; font-size: 17px; color: #0f172a;">${postTitle}</h3>
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: ${statusInfo.color}; background-color: ${statusInfo.bg};">
          ${statusInfo.label}
        </span>
      </div>

      <div style="margin-bottom: 24px;">
        <a href="${targetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          ${changelogUrl ? "Lihat Detail Rilis di Changelog" : "Lihat Post di Board"}
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Tautan post: <a href="${postUrl}" style="color: #2563eb; text-decoration: underline;">${postUrl}</a>
      </p>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
      Anda menerima email ini karena Anda telah memberikan upvote pada ide ini di ${workspaceName}.
    </div>
  </div>
</body>
</html>`
}

/**
 * Send voter notification email via Resend or fallback mock
 */
export async function sendVoterNotificationEmail(
  payload: VoterNotificationPayload,
  apiKey?: string,
): Promise<{
  success: boolean
  id?: string
  mode: "resend" | "mock"
  error?: string
}> {
  const effectiveApiKey = apiKey || process.env.RESEND_API_KEY

  if (!effectiveApiKey) {
    // Development / Test mock fallback
    const mockId = `mock_email_${Math.random().toString(36).substring(2, 10)}`
    return {
      success: true,
      id: mockId,
      mode: "mock",
    }
  }

  const html = renderVoterStatusUpdateHtml(payload)
  const statusLabel =
    payload.newStatus === "shipped" ? "Telah Dirilis!" : "Diperbarui"

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${effectiveApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${payload.workspaceName} <updates@katauser.com>`,
        to: payload.recipientEmail,
        subject: `[Update] "${payload.postTitle}" ${statusLabel}`,
        html,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error")
      return { success: false, mode: "resend", error: errText }
    }

    const data = (await res.json()) as { id: string }
    return { success: true, id: data.id, mode: "resend" }
  } catch (err: any) {
    return { success: false, mode: "resend", error: err.message }
  }
}
