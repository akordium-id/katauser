<script lang="ts">
  import {
    parseSSEChunk,
    isEscalationRequested,
    formatMessageTime,
    type ChatMessage,
  } from "../../chat-helpers"

  let {
    workspaceId = "default",
    apiUrl = "http://localhost:3000",
    user = null,
  }: {
    workspaceId?: string
    apiUrl?: string
    user?: { userId?: string; name?: string; email?: string } | null
  } = $props()

  let conversationId = $state<string | null>(null)
  let inputMessage = $state("")
  let isSending = $state(false)
  let isEscalated = $state(false)
  let chatContainer = $state<HTMLDivElement | null>(null)

  let guestEmail = $state("")
  let guestEmailError = $state<string | null>(null)
  let isActionSubmitting = $state(false)

  let messages = $state<ChatMessage[]>([
    {
      id: "init_1",
      sender: "juno",
      text: "Halo! Saya Juno, asisten AI Katauser. Ada yang bisa saya bantu seputar produk atau feedback Anda hari ini?",
      time: formatMessageTime(new Date().toISOString()),
    },
  ])

  function validateEmail(emailStr: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "planned":
        return "Planned"
      case "in_progress":
        return "In Progress"
      case "completed":
        return "Completed"
      case "under_review":
        return "Under Review"
      case "closed":
        return "Closed"
      default:
        return "Open"
    }
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "planned":
        return "badge-blue"
      case "in_progress":
        return "badge-amber"
      case "completed":
        return "badge-emerald"
      case "under_review":
        return "badge-amber"
      case "closed":
        return "badge-gray"
      default:
        return "badge-blue"
    }
  }

  function scrollToBottom() {
    if (chatContainer) {
      setTimeout(() => {
        chatContainer?.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: "smooth",
        })
      }, 50)
    }
  }

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId

    try {
      const res = await fetch(`${apiUrl}/api/v1/chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          endUserId:
            user?.userId ||
            "guest_" + Math.random().toString(36).substring(2, 8),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        conversationId = data.conversation.id
        return data.conversation.id
      }
    } catch (err) {
      console.warn("[Katauser Widget] Failed to create conversation:", err)
    }
    const fallbackId = "conv_local_" + Date.now()
    conversationId = fallbackId
    return fallbackId
  }

  async function handleSendMessage(e?: Event) {
    e?.preventDefault()
    const text = inputMessage.trim()
    if (!text || isSending) return

    inputMessage = ""
    isSending = true

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      sender: "user",
      text,
      time: formatMessageTime(new Date().toISOString()),
    }
    messages.push(userMsg)
    scrollToBottom()

    // Check escalation intent
    if (isEscalationRequested(text)) {
      isEscalated = true
    }

    const convId = await ensureConversation()

    // Post message to API in background
    fetch(`${apiUrl}/api/v1/chat/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: convId,
        senderType: "end_user",
        senderId: user?.userId || "guest",
        content: text,
      }),
    }).catch(() => {})

    // Stream Juno AI response
    try {
      const streamRes = await fetch(
        `${apiUrl}/api/v1/chat/conversations/${convId}/juno-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        },
      )

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader()
        const decoder = new TextDecoder("utf-8")
        let aiMsg: ChatMessage = {
          id: "juno_" + Date.now(),
          sender: "juno",
          text: "",
          time: formatMessageTime(new Date().toISOString()),
        }
        messages.push(aiMsg)
        const aiMsgIndex = messages.length - 1

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            const chunkRes = parseSSEChunk(line)
            if (typeof chunkRes === "string") {
              messages[aiMsgIndex].text += chunkRes
              scrollToBottom()
            } else if (chunkRes && typeof chunkRes === "object") {
              if (chunkRes.text) {
                messages[aiMsgIndex].text += chunkRes.text
              }
              if (chunkRes.action) {
                messages[aiMsgIndex].action = chunkRes.action
              }
              scrollToBottom()
            }
          }
        }
      } else {
        // Fallback response if offline / local mock
        messages.push({
          id: "juno_fb_" + Date.now(),
          sender: "juno",
          text: "Terima kasih atas pesan Anda! Tim kami telah menerima pesan ini dan akan segera merespons.",
          time: formatMessageTime(new Date().toISOString()),
        })
      }
    } catch {
      messages.push({
        id: "juno_err_" + Date.now(),
        sender: "juno",
        text: "Pesan berhasil dicatat. Tim kami akan segera menindaklanjuti.",
        time: formatMessageTime(new Date().toISOString()),
      })
    } finally {
      isSending = false
      scrollToBottom()
    }
  }

  async function handleVoteSimilarPost(msg: ChatMessage, postId: string) {
    const email = user?.email || guestEmail.trim()
    if (!email) {
      guestEmailError = "Silakan masukkan email Anda untuk melanjutkan."
      return
    }
    if (!validateEmail(email)) {
      guestEmailError = "Format email tidak valid."
      return
    }
    guestEmailError = null
    isActionSubmitting = true

    try {
      const res = await fetch(`${apiUrl}/api/v1/posts/${postId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.userId || `guest_${email}`,
          ...(email ? { "x-user-email": email } : {}),
        },
      })

      if (res.ok) {
        msg.actionResolved = true
        if (msg.action && msg.action.type === "similar_post") {
          msg.action.post.votesCount += 1
        }
        messages.push({
          id: "juno_conf_" + Date.now(),
          sender: "juno",
          text: "Terima kasih! Suara Anda telah berhasil ditambahkan. Kami akan mengabari Anda jika ada pembaruan status pada fitur ini.",
          time: formatMessageTime(new Date().toISOString()),
        })
        scrollToBottom()
      } else {
        const data = await res.json().catch(() => null)
        guestEmailError =
          data?.message ||
          data?.error ||
          "Gagal menambahkan suara. Silakan coba lagi."
      }
    } catch {
      guestEmailError = "Gagal menghubungi server. Silakan coba lagi."
    } finally {
      isActionSubmitting = false
    }
  }

  async function handleCreateFeedbackFromChat(
    msg: ChatMessage,
    boardId: string,
    draft: { title: string; content: string },
  ) {
    const email = user?.email || guestEmail.trim()
    if (!email) {
      guestEmailError = "Silakan masukkan email Anda untuk melanjutkan."
      return
    }
    if (!validateEmail(email)) {
      guestEmailError = "Format email tidak valid."
      return
    }
    guestEmailError = null
    isActionSubmitting = true

    try {
      const res = await fetch(`${apiUrl}/api/v1/boards/${boardId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.userId || `guest_${email}`,
          ...(email ? { "x-user-email": email } : {}),
        },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
        }),
      })

      if (res.ok) {
        msg.actionResolved = true
        messages.push({
          id: "juno_conf_" + Date.now(),
          sender: "juno",
          text: "Saran Anda telah berhasil dikirim ke board masukan. Tim produk kami akan segera meninjaunya!",
          time: formatMessageTime(new Date().toISOString()),
        })
        scrollToBottom()
      } else {
        const data = await res.json().catch(() => null)
        guestEmailError =
          data?.message ||
          data?.error ||
          "Gagal mengirim ide feedback. Silakan coba lagi."
      }
    } catch {
      guestEmailError = "Gagal menghubungi server. Silakan coba lagi."
    } finally {
      isActionSubmitting = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
</script>

<div class="messages-container">
  <!-- AI Agent Juno Hero -->
  <div class="ai-hero">
    <div class="avatar-ring">
      <div class="avatar-circle">J</div>
    </div>
    <div class="hero-title">Hai{user?.name ? `, ${user.name}` : ""}!</div>
    <div class="hero-desc">
      Saya Juno, asisten cerdas Katauser. Tanyakan fitur atau kendala apa pun.
    </div>
  </div>

  {#if isEscalated}
    <div class="escalation-banner">
      <span class="escalation-icon">👥</span>
      <span class="escalation-text"
        >Percakapan telah dialihkan ke tim support manusia kami.</span
      >
    </div>
  {/if}

  <!-- Chat History Scroll View -->
  <div class="chat-scroll" bind:this={chatContainer}>
    {#each messages as msg (msg.id)}
      <div class="message-row {msg.sender === 'user' ? 'user-row' : 'bot-row'}">
        {#if msg.sender !== "user"}
          <div class="bot-badge">J</div>
        {/if}
        <div class="message-content">
          <div
            class="bubble {msg.sender === 'user'
              ? 'user-bubble'
              : 'bot-bubble'}"
          >
            {#if msg.text}
              <div class="bubble-text">{msg.text}</div>
            {/if}

            {#if msg.action}
              <div class="action-card">
                {#if msg.action.type === "similar_post"}
                  {@const action = msg.action}
                  <div class="action-card-header">
                    <span class="status-badge {getStatusBadgeClass(action.post.status)}">
                      {getStatusLabel(action.post.status)}
                    </span>
                    <span class="similarity-pill">
                      {Math.round(action.similarityScore * 100)}% Cocok
                    </span>
                    <span class="votes-pill">▲ {action.post.votesCount}</span>
                  </div>
                  <div class="action-card-title">{action.post.title}</div>
                  {#if action.post.content}
                    <div class="action-card-desc">{action.post.content}</div>
                  {/if}

                  <div class="action-card-footer">
                    {#if msg.actionResolved}
                      <div class="action-resolved">
                        <span>✓ Upvote Anda telah ditambahkan</span>
                      </div>
                    {:else}
                      {#if !user?.email}
                        <div class="action-email-box">
                          <input
                            type="email"
                            bind:value={guestEmail}
                            placeholder="Email Anda untuk notifikasi..."
                            class="action-email-input"
                            disabled={isActionSubmitting}
                          />
                        </div>
                      {/if}
                      {#if guestEmailError}
                        <div class="action-error-msg">{guestEmailError}</div>
                      {/if}
                      <button
                        type="button"
                        class="btn-card-action"
                        disabled={isActionSubmitting}
                        onclick={() => handleVoteSimilarPost(msg, action.post.id)}
                      >
                        {isActionSubmitting ? "Memproses..." : "+1 Upvote"}
                      </button>
                    {/if}
                  </div>
                {:else if msg.action.type === "create_feedback"}
                  {@const action = msg.action}
                  <div class="action-card-header">
                    <span class="board-badge">
                      Board #{action.boardSlug}
                    </span>
                    <span class="new-pill">Saran Baru</span>
                  </div>
                  <div class="action-card-title">{action.draft.title}</div>
                  {#if action.draft.content}
                    <div class="action-card-desc">{action.draft.content}</div>
                  {/if}

                  <div class="action-card-footer">
                    {#if msg.actionResolved}
                      <div class="action-resolved">
                        <span>✓ Ide telah dikirim ke board</span>
                      </div>
                    {:else}
                      {#if !user?.email}
                        <div class="action-email-box">
                          <input
                            type="email"
                            bind:value={guestEmail}
                            placeholder="Email Anda untuk update..."
                            class="action-email-input"
                            disabled={isActionSubmitting}
                          />
                        </div>
                      {/if}
                      {#if guestEmailError}
                        <div class="action-error-msg">{guestEmailError}</div>
                      {/if}
                      <button
                        type="button"
                        class="btn-card-action"
                        disabled={isActionSubmitting}
                        onclick={() => handleCreateFeedbackFromChat(msg, action.boardId, action.draft)}
                      >
                        {isActionSubmitting ? "Mengirim..." : "Kirim ke Feedback Board"}
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
          <span class="message-time">{msg.time}</span>
        </div>
      </div>
    {/each}
  </div>

  <!-- Chat Input Bar -->
  <form onsubmit={handleSendMessage} class="chat-input-box">
    <input
      type="text"
      bind:value={inputMessage}
      onkeydown={handleKeydown}
      placeholder="Ketik pesan untuk Juno..."
      class="chat-input"
      disabled={isSending}
    />
    <button
      type="submit"
      disabled={isSending || !inputMessage.trim()}
      class="btn-send"
      aria-label="Kirim pesan"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    </button>
  </form>
</div>

<style>
  .messages-container {
    padding: 14px;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }
  .ai-hero {
    text-align: center;
    padding: 4px 8px 10px 8px;
    border-bottom: 1px solid #f1f5f9;
  }
  .avatar-ring {
    display: inline-flex;
    padding: 2px;
    border-radius: 9999px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    margin-bottom: 4px;
  }
  .avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background: #ffffff;
    color: #4f46e5;
    font-size: 15px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hero-title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }
  .hero-desc {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
    line-height: 1.3;
  }
  .escalation-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #b45309;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 11px;
    margin: 8px 0;
  }
  .chat-scroll {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding: 10px 0;
  }
  .message-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .user-row {
    flex-direction: row-reverse;
  }
  .bot-badge {
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    background: #4f46e5;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-bottom: 14px;
  }
  .message-content {
    display: flex;
    flex-direction: column;
    max-width: 85%;
  }
  .user-row .message-content {
    align-items: flex-end;
  }
  .bubble {
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 12px;
    line-height: 1.4;
    word-break: break-word;
  }
  .bubble-text {
    word-break: break-word;
  }
  .bot-bubble {
    background: #f1f5f9;
    color: #1e293b;
    border-bottom-left-radius: 2px;
  }
  .user-bubble {
    background: #4f46e5;
    color: #ffffff;
    border-bottom-right-radius: 2px;
  }
  .action-card {
    margin-top: 8px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
    color: #0f172a;
  }
  .action-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 2px;
  }
  .status-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 9999px;
  }
  .badge-blue {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
  }
  .badge-amber {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  .badge-emerald {
    background: #ecfdf5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  .badge-gray {
    background: #f1f5f9;
    color: #64748b;
    border: 1px solid #cbd5e1;
  }
  .similarity-pill {
    font-size: 10px;
    font-weight: 700;
    color: #7c3aed;
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    padding: 2px 6px;
    border-radius: 9999px;
  }
  .votes-pill {
    font-size: 10px;
    font-weight: 700;
    color: #475569;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .board-badge {
    font-size: 10px;
    font-weight: 600;
    color: #4338ca;
    background: #e0e7ff;
    border: 1px solid #c7d2fe;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .new-pill {
    font-size: 10px;
    font-weight: 700;
    color: #059669;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    padding: 2px 6px;
    border-radius: 9999px;
  }
  .action-card-title {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
  }
  .action-card-desc {
    font-size: 11px;
    color: #475569;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .action-card-footer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px solid #f1f5f9;
  }
  .action-resolved {
    font-size: 11px;
    font-weight: 600;
    color: #059669;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
  }
  .action-email-box {
    width: 100%;
  }
  .action-email-input {
    width: 100%;
    box-sizing: border-box;
    padding: 5px 8px;
    font-size: 11px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    outline: none;
    background: #f8fafc;
    color: #0f172a;
    font-family: inherit;
  }
  .action-email-input:focus {
    border-color: #6366f1;
    background: #ffffff;
  }
  .action-error-msg {
    font-size: 10px;
    color: #dc2626;
    font-weight: 500;
  }
  .btn-card-action {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .btn-card-action:hover:not(:disabled) {
    background: #4338ca;
  }
  .btn-card-action:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .message-time {
    font-size: 9px;
    color: #94a3b8;
    margin-top: 3px;
    padding: 0 4px;
  }
  .chat-input-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
  }
  .chat-input {
    flex: 1;
    padding: 8px 12px;
    font-size: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    font-family: inherit;
    background: #ffffff;
    color: #0f172a;
    box-sizing: border-box;
  }
  .chat-input:focus {
    border-color: #6366f1;
  }
  .btn-send {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .btn-send:hover:not(:disabled) {
    background: #4338ca;
  }
  .btn-send:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
