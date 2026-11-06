<script lang="ts">
  import {
    parseSSEChunk,
    isEscalationRequested,
    formatMessageTime,
  } from "../../chat-helpers"

  interface ChatMessage {
    id: string
    sender: "user" | "juno" | "human"
    text: string
    time: string
  }

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

  let messages = $state<ChatMessage[]>([
    {
      id: "init_1",
      sender: "juno",
      text: "Halo! Saya Juno, asisten AI Katauser. Ada yang bisa saya bantu seputar produk atau feedback Anda hari ini?",
      time: formatMessageTime(new Date().toISOString()),
    },
  ])

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
            const token = parseSSEChunk(line)
            if (token) {
              messages[aiMsgIndex].text += token
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
    } catch (err) {
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
            {msg.text}
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
    max-width: 80%;
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
