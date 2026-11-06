<script lang="ts">
  let {
    workspaceId = 'default',
    apiUrl = 'http://localhost:3000',
  }: {
    workspaceId?: string;
    apiUrl?: string;
  } = $props();

  let title = $state('');
  let content = $state('');
  let isSubmitting = $state(false);
  let isSuccess = $state(false);

  let items = $state([
    { id: 'f1', title: 'Integrasi Slack Notifications', votes: 42, voted: false },
    { id: 'f2', title: 'Dukungan Custom Domain SSL', votes: 88, voted: false },
    { id: 'f3', title: 'Export Data CSV & JSON', votes: 19, voted: false },
  ]);

  function handleVote(item: typeof items[0]) {
    if (item.voted) {
      item.votes -= 1;
      item.voted = false;
    } else {
      item.votes += 1;
      item.voted = true;
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!title.trim()) return;

    isSubmitting = true;
    setTimeout(() => {
      items.unshift({
        id: 'f_' + Date.now(),
        title,
        votes: 1,
        voted: true,
      });
      title = '';
      content = '';
      isSubmitting = false;
      isSuccess = true;
      setTimeout(() => {
        isSuccess = false;
      }, 3000);
    }, 400);
  }
</script>

<div class="feedback-container">
  <div class="submit-card">
    <h4 class="section-title">Punya ide atau saran?</h4>
    {#if isSuccess}
      <div class="success-banner">✓ Ide Anda berhasil dikirim!</div>
    {/if}
    <form onsubmit={handleSubmit}>
      <input
        type="text"
        bind:value={title}
        placeholder="Tuliskan ide fitur Anda..."
        class="input-field"
        required
      />
      {#if title.trim()}
        <textarea
          bind:value={content}
          placeholder="Berikan detail tambahan (opsional)..."
          rows="2"
          class="textarea-field"
        ></textarea>
      {/if}
      <div class="form-actions">
        <button type="submit" disabled={isSubmitting || !title.trim()} class="btn-primary">
          {isSubmitting ? 'Mengirim...' : 'Kirim Ide'}
        </button>
      </div>
    </form>
  </div>

  <div class="popular-list">
    <div class="list-header">Ide Populer Komunitas</div>
    {#each items as item (item.id)}
      <div class="post-item">
        <div class="post-content">
          <span class="post-title">{item.title}</span>
        </div>
        <button
          type="button"
          onclick={() => handleVote(item)}
          class="vote-pill {item.voted ? 'voted' : ''}"
        >
          ▲ {item.votes}
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .feedback-container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
  }
  .submit-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
  }
  .section-title {
    margin: 0 0 10px 0;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }
  .success-banner {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .input-field,
  .textarea-field {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    font-size: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    margin-bottom: 8px;
    font-family: inherit;
    background: #ffffff;
    color: #0f172a;
    outline: none;
  }
  .input-field:focus,
  .textarea-field:focus {
    border-color: #6366f1;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
  }
  .btn-primary {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-primary:hover:not(:disabled) {
    background: #4338ca;
  }
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .popular-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .list-header {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    color: #64748b;
  }
  .post-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    gap: 12px;
  }
  .post-content {
    flex: 1;
    min-width: 0;
  }
  .post-title {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .vote-pill {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .vote-pill:hover {
    border-color: #6366f1;
    color: #4f46e5;
  }
  .vote-pill.voted {
    background: #ede9fe;
    border-color: #a78bfa;
    color: #6d28d9;
  }
</style>

