<script lang="ts">
  let {
    workspaceId = 'default',
  }: {
    workspaceId?: string;
  } = $props();

  let columns = $state([
    {
      key: 'planned',
      title: 'Planned',
      badgeClass: 'badge-blue',
      items: [
        { id: 'r1', title: 'Slack Notifications Integration', votes: 42 },
      ],
    },
    {
      key: 'inProgress',
      title: 'In Progress',
      badgeClass: 'badge-amber',
      items: [
        { id: 'r2', title: 'Custom Domain SSL Auto-provisioning', votes: 88 },
      ],
    },
    {
      key: 'completed',
      title: 'Completed',
      badgeClass: 'badge-emerald',
      items: [
        { id: 'r3', title: 'SvelteKit 2 + Svelte 5 Modernization', votes: 154 },
      ],
    },
  ]);
</script>

<div class="roadmap-container">
  <div class="header-intro">
    <div class="title">Rencana & Progres Pengembangan</div>
    <div class="subtitle">Transparansi roadmap fitur kami untuk Anda.</div>
  </div>

  <div class="columns-stack">
    {#each columns as col (col.key)}
      <div class="column-card">
        <div class="column-header">
          <span class="status-badge {col.badgeClass}">{col.title}</span>
          <span class="items-count">{col.items.length}</span>
        </div>
        <div class="items-list">
          {#each col.items as item (item.id)}
            <div class="roadmap-item">
              <span class="item-title">{item.title}</span>
              <span class="item-votes">▲ {item.votes}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .roadmap-container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
  }
  .header-intro .title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }
  .header-intro .subtitle {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
  }
  .columns-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .column-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
  }
  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .status-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
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
  .items-count {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 600;
  }
  .items-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .roadmap-item {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .item-title {
    font-size: 12px;
    font-weight: 500;
    color: #1e293b;
  }
  .item-votes {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 6px;
    white-space: nowrap;
  }
</style>
