<script lang="ts">
  import { createApiClient } from '$lib/api';

  let { data } = $props();

  let boards = $state<any[]>([]);
  let isCreateBoardOpen = $state(false);
  let newBoardName = $state('');
  let newBoardSlug = $state('');
  let newBoardDesc = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    boards = data.boards || [];
  });

  const api = createApiClient();

  async function handleCreateBoard(e: SubmitEvent) {
    e.preventDefault();
    if (!newBoardName.trim() || !newBoardSlug.trim()) {
      error = 'Nama dan slug board wajib diisi';
      return;
    }
    loading = true;
    error = null;
    try {
      const res = await api.api.v1.workspaces[':slug'].boards.$post({
        param: { slug: data.workspaceSlug },
        json: {
          name: newBoardName,
          slug: newBoardSlug,
          description: newBoardDesc || undefined,
          isPrivate: false,
          allowGuestPosts: true,
        },
      });
      if (res.ok) {
        const { board } = await res.json();
        boards = [...boards, board];
        newBoardName = '';
        newBoardSlug = '';
        newBoardDesc = '';
        isCreateBoardOpen = false;
      } else {
        const errData = (await res.json()) as any;
        error = errData.errors?.[0]?.message || 'Gagal membuat board';
      }
    } catch (err: any) {
      error = err.message || 'Gagal menghubungi server';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Kelola Feedback Boards | Katauser Admin</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 p-8">
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between pb-6 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Feedback Boards</h1>
        <p class="text-sm text-slate-500 mt-1">
          Kelola board masukan, ide pengguna, dan status voting untuk workspace <span class="font-semibold text-slate-700">{data.workspaceSlug}</span>.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <a
          href="/dashboard/{data.workspaceSlug}/settings/ai"
          class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <span>🤖 AI Juno Docs</span>
        </a>
        <a
          href="/dashboard/{data.workspaceSlug}/settings/integrations"
          class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <span>💬 Integrasi Webhook</span>
        </a>
        <a
          href="/dashboard/{data.workspaceSlug}/settings/domain"
          class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
        >
          <span>🌐 Custom Domain</span>
        </a>
        <button
          type="button"
          onclick={() => (isCreateBoardOpen = true)}
          class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Board Baru
        </button>
      </div>
    </div>

    <!-- Boards List -->
    <div class="mt-8">
      {#if boards.length === 0}
        <div class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div class="mx-auto h-12 w-12 text-slate-400 mb-3">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-sm font-semibold text-slate-900">Belum ada board dibuat</h3>
          <p class="text-xs text-slate-500 mt-1">
            Buat feedback board pertama untuk mulai mengumpulkan ide dari pengguna kamu.
          </p>
          <button
            type="button"
            onclick={() => (isCreateBoardOpen = true)}
            class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            Buat Board Sekarang
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each boards as board (board.id)}
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-base font-bold text-slate-900">{board.name}</h3>
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {board.isPrivate ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                    {board.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                <p class="text-xs text-slate-500 line-clamp-2">{board.description || 'Tidak ada deskripsi'}</p>
              </div>

              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-xs text-slate-400 font-mono">/b/{data.workspaceSlug}/{board.slug}</span>
                <a
                  href="/b/{data.workspaceSlug}/{board.slug}"
                  target="_blank"
                  rel="noreferrer"
                  class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  Buka Portal Publik &rarr;
                </a>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Create Board Modal -->
  {#if isCreateBoardOpen}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 class="text-base font-bold text-slate-900">Tambah Feedback Board</h2>
          <button
            type="button"
            onclick={() => (isCreateBoardOpen = false)}
            aria-label="Tutup modal"
            class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onsubmit={handleCreateBoard} class="mt-4 space-y-3.5">
          {#if error}
            <div class="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          {/if}

          <div>
            <label for="board-name" class="block text-xs font-semibold text-slate-700 mb-1">Nama Board</label>
            <input
              id="board-name"
              type="text"
              bind:value={newBoardName}
              placeholder="Contoh: Fitur Baru"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label for="board-slug" class="block text-xs font-semibold text-slate-700 mb-1">Slug URL</label>
            <input
              id="board-slug"
              type="text"
              bind:value={newBoardSlug}
              placeholder="contoh: fitur-baru"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 outline-none font-mono"
              required
            />
          </div>

          <div>
            <label for="board-desc" class="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
            <textarea
              id="board-desc"
              bind:value={newBoardDesc}
              rows="2"
              placeholder="Tujuan board ini..."
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 outline-none resize-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onclick={() => (isCreateBoardOpen = false)}
              class="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              class="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

