<script lang="ts">
  let {
    workspaceId = 'default',
    user = null,
  }: {
    workspaceId?: string;
    user?: { name?: string; email?: string } | null;
  } = $props();
</script>

<div class="messages-container">
  <div class="ai-hero">
    <div class="avatar-ring">
      <div class="avatar-circle">J</div>
    </div>
    <div class="hero-title">Hai{user?.name ? `, ${user.name}` : ''}!</div>
    <div class="hero-desc">
      Saya Juno, asisten AI Katauser. Anda dapat mengajukan pertanyaan tentang produk atau meminta bantuan kepada tim kami.
    </div>
  </div>

  <div class="chat-placeholder">
    <div class="message-bubble bot">
      Ada yang bisa saya bantu hari ini? Tulis pesan di bawah ini untuk memulai percakapan.
    </div>
  </div>

  <div class="chat-input-box">
    <input
      type="text"
      placeholder="Ketik pesan untuk Juno..."
      class="chat-input"
    />
    <button type="button" class="btn-send" aria-label="Kirim pesan">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    </button>
  </div>
</div>

<style>
  .messages-container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }
  .ai-hero {
    text-align: center;
    padding: 12px 8px;
    margin-bottom: 12px;
  }
  .avatar-ring {
    display: inline-flex;
    padding: 3px;
    border-radius: 9999px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    margin-bottom: 8px;
  }
  .avatar-circle {
    width: 40px;
    height: 40px;
    border-radius: 9999px;
    background: #ffffff;
    color: #4f46e5;
    font-size: 18px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hero-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }
  .hero-desc {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
    line-height: 1.4;
  }
  .chat-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    padding: 8px 0;
  }
  .message-bubble {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 12px;
    line-height: 1.4;
    max-width: 85%;
  }
  .message-bubble.bot {
    background: #f1f5f9;
    color: #1e293b;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }
  .chat-input-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 10px;
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
  }
  .btn-send:hover {
    background: #4338ca;
  }
</style>
