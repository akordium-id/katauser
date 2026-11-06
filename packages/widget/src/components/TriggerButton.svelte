<script lang="ts">
  let {
    isOpen = false,
    unreadCount = 0,
    onClick,
  }: {
    isOpen?: boolean
    unreadCount?: number
    onClick?: () => void
  } = $props()
</script>

<button
  type="button"
  onclick={onClick}
  class="trigger-btn {isOpen ? 'open' : ''}"
  aria-label={isOpen ? "Tutup widget Katauser" : "Buka widget Katauser"}
>
  {#if isOpen}
    <!-- Close icon (X) -->
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  {:else}
    <!-- Katauser / chat bubble icon -->
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      ></path>
    </svg>
  {/if}

  {#if !isOpen && unreadCount > 0}
    <span class="badge-pill">{unreadCount}</span>
  {/if}
</button>

<style>
  .trigger-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #4f46e5;
    color: #ffffff;
    border: none;
    box-shadow:
      0 10px 15px -3px rgba(79, 70, 229, 0.3),
      0 4px 6px -4px rgba(79, 70, 229, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.2s;
    z-index: 2147483647;
    outline: none;
  }
  .trigger-btn:hover {
    background: #4338ca;
    transform: scale(1.05);
  }
  .trigger-btn:active {
    transform: scale(0.95);
  }
  .badge-pill {
    position: absolute;
    top: -3px;
    right: -3px;
    background: #ef4444;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid #ffffff;
  }
</style>
