<script lang="ts">
  let {
    workspaceId = 'default',
  }: {
    workspaceId?: string;
  } = $props();

  let releases = $state([
    {
      id: 'c1',
      version: 'v1.2.0',
      title: 'Public Roadmap & Svelte 5 Optimization',
      date: 'Hari ini',
      content: 'Peluncuran Public Roadmap Kanban dan upgrade performa UI ke Svelte 5 Runes.',
      tag: 'New Feature',
    },
    {
      id: 'c2',
      version: 'v1.1.0',
      title: 'Real-time Feedback Board & Voting',
      date: 'Minggu lalu',
      content: 'Sistem voting atomik dan feedback portal untuk menampung seluruh ide user.',
      tag: 'Improvement',
    },
  ]);
</script>

<div class="changelog-container">
  <div class="header-intro">
    <div class="title">Catatan Rilis & Pembaruan</div>
    <div class="subtitle">Apa yang baru saja kami rilis untuk Anda.</div>
  </div>

  <div class="releases-list">
    {#each releases as rel (rel.id)}
      <div class="release-card">
        <div class="release-meta">
          <span class="version-tag">{rel.version}</span>
          <span class="type-tag">{rel.tag}</span>
          <span class="date-text">{rel.date}</span>
        </div>
        <div class="release-title">{rel.title}</div>
        <div class="release-desc">{rel.content}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .changelog-container {
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
  .releases-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .release-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .release-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .version-tag {
    font-size: 10px;
    font-weight: 700;
    background: #ede9fe;
    color: #6d28d9;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .type-tag {
    font-size: 10px;
    font-weight: 600;
    background: #ecfdf5;
    color: #059669;
    padding: 2px 6px;
    border-radius: 6px;
  }
  .date-text {
    font-size: 10px;
    color: #94a3b8;
    margin-left: auto;
  }
  .release-title {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }
  .release-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }
</style>

