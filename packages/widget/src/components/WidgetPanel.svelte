<script lang="ts">
  import type { WidgetTab, WidgetUser } from '../sdk';
  import FeedbackTab from './tabs/FeedbackTab.svelte';
  import RoadmapTab from './tabs/RoadmapTab.svelte';
  import ChangelogTab from './tabs/ChangelogTab.svelte';
  import MessagesTab from './tabs/MessagesTab.svelte';

  let {
    isOpen = false,
    activeTab = 'feedback',
    workspaceId = 'default',
    apiUrl = 'http://localhost:3000',
    user = null,
    onTabChange,
    onClose,
  }: {
    isOpen?: boolean;
    activeTab?: WidgetTab;
    workspaceId?: string;
    apiUrl?: string;
    user?: WidgetUser | null;
    onTabChange?: (tab: WidgetTab) => void;
    onClose?: () => void;
  } = $props();
</script>

{#if isOpen}
  <div class="widget-panel" role="dialog" aria-modal="true">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-brand">
        <div class="brand-avatar">K</div>
        <div class="brand-text">
          <span class="brand-title">Katauser</span>
          <span class="brand-subtitle">{workspaceId}</span>
        </div>
      </div>
      <button type="button" class="btn-close" onclick={onClose} aria-label="Tutup">
        ✕
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-nav">
      <button
        type="button"
        class="tab-btn {activeTab === 'feedback' ? 'active' : ''}"
        onclick={() => onTabChange?.('feedback')}
      >
        Saran
      </button>
      <button
        type="button"
        class="tab-btn {activeTab === 'roadmap' ? 'active' : ''}"
        onclick={() => onTabChange?.('roadmap')}
      >
        Roadmap
      </button>
      <button
        type="button"
        class="tab-btn {activeTab === 'changelog' ? 'active' : ''}"
        onclick={() => onTabChange?.('changelog')}
      >
        Rilis
      </button>
      <button
        type="button"
        class="tab-btn {activeTab === 'messages' ? 'active' : ''}"
        onclick={() => onTabChange?.('messages')}
      >
        Chat
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-body">
      {#if activeTab === 'feedback'}
        <FeedbackTab {workspaceId} {apiUrl} />
      {:else if activeTab === 'roadmap'}
        <RoadmapTab {workspaceId} />
      {:else if activeTab === 'changelog'}
        <ChangelogTab {workspaceId} />
      {:else if activeTab === 'messages'}
        <MessagesTab {workspaceId} {user} />
      {/if}
    </div>

    <!-- Footer -->
    <div class="panel-footer">
      <span class="footer-text">Powered by <strong>Katauser</strong></span>
    </div>
  </div>
{/if}

<style>
  .widget-panel {
    position: fixed;
    bottom: 92px;
    right: 24px;
    width: 380px;
    max-width: calc(100vw - 32px);
    height: 580px;
    max-height: calc(100vh - 120px);
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 2147483646;
    animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  .panel-header {
    background: #4f46e5;
    color: #ffffff;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-avatar {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16px;
  }
  .brand-text {
    display: flex;
    flex-direction: column;
  }
  .brand-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
  }
  .brand-subtitle {
    font-size: 11px;
    opacity: 0.8;
  }
  .btn-close {
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 16px;
    cursor: pointer;
    opacity: 0.75;
    padding: 4px;
    border-radius: 6px;
  }
  .btn-close:hover {
    opacity: 1;
  }
  .tabs-nav {
    display: flex;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .tab-btn {
    flex: 1;
    background: transparent;
    border: none;
    padding: 10px 4px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
    font-family: inherit;
  }
  .tab-btn:hover {
    color: #1e293b;
  }
  .tab-btn.active {
    color: #4f46e5;
    border-bottom-color: #4f46e5;
    background: #ffffff;
  }
  .tab-body {
    flex: 1;
    overflow: hidden;
    position: relative;
    background: #ffffff;
  }
  .panel-footer {
    border-top: 1px solid #f1f5f9;
    padding: 8px 16px;
    text-align: center;
    background: #fafafa;
  }
  .footer-text {
    font-size: 10px;
    color: #94a3b8;
  }
</style>
