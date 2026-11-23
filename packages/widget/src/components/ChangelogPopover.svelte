<script lang="ts">
  import type { ChangelogSummary } from "../sdk"

  let {
    latest,
    position = "bottom-right",
    onOpen,
    onDismiss,
  }: {
    latest: ChangelogSummary
    position?: "bottom-right" | "bottom-left"
    onOpen?: () => void
    onDismiss?: () => void
  } = $props()
</script>

<div
  class="popover-card {position}"
  role="region"
  aria-label="Pemberitahuan Rilis Baru"
>
  <div class="popover-header">
    <div class="badge-tag">
      <span class="sparkle">✨</span>
      <span>Pembaruan Baru</span>
    </div>
    <button
      type="button"
      class="btn-dismiss"
      onclick={onDismiss}
      aria-label="Tutup pemberitahuan"
    >
      ✕
    </button>
  </div>

  <div class="popover-body">
    <div class="release-title">{latest.title}</div>
    <p class="release-snippet">{latest.content}</p>
  </div>

  <div class="popover-footer">
    <button type="button" class="btn-action" onclick={onOpen}>
      <span>Lihat Rilis Baru</span>
      <span class="arrow">→</span>
    </button>
  </div>
</div>

<style>
  .popover-card {
    position: fixed;
    bottom: 92px;
    z-index: 999998;
    width: 300px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow:
      0 12px 28px -4px rgba(15, 23, 42, 0.12),
      0 4px 10px -2px rgba(15, 23, 42, 0.04);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
    font-family: inherit;
    animation: slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .popover-card.bottom-right {
    right: 24px;
  }

  .popover-card.bottom-left {
    left: 24px;
  }

  .popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #ede9fe;
    color: #6d28d9;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
  }

  .sparkle {
    font-size: 12px;
  }

  .btn-dismiss {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-dismiss:hover {
    color: #475569;
    background: #f1f5f9;
  }

  .popover-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .release-title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .release-snippet {
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .popover-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 2px;
  }

  .btn-action {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #4f46e5;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: background 150ms ease;
  }

  .btn-action:hover {
    background: #4338ca;
  }

  .arrow {
    font-size: 13px;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
