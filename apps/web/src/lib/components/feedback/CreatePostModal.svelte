<script lang="ts">
  let {
    isOpen = false,
    onClose,
    onSubmit,
  }: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: { title: string; content: string }) => Promise<void> | void
  } = $props()

  let title = $state("")
  let content = $state("")
  let loading = $state(false)
  let error = $state<string | null>(null)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      error = "Judul dan penjelasan ide wajib diisi"
      return
    }
    loading = true
    error = null
    try {
      await onSubmit({ title, content })
      title = ""
      content = ""
      onClose()
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Gagal mengirim ide feedback"
    } finally {
      loading = false
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
    >
      <div
        class="flex items-center justify-between pb-4 border-b border-slate-100"
      >
        <h2 class="text-lg font-bold text-slate-900">Kirim Ide Baru</h2>
        <button
          type="button"
          onclick={onClose}
          aria-label="Tutup modal"
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onsubmit={handleSubmit} class="mt-4 space-y-4">
        {#if error}
          <div
            class="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200"
          >
            {error}
          </div>
        {/if}

        <div>
          <label
            for="post-title"
            class="block text-xs font-semibold text-slate-700 mb-1"
          >
            Judul Singkat
          </label>
          <input
            id="post-title"
            type="text"
            bind:value={title}
            placeholder="Contoh: Integrasi dengan Google Calendar"
            class="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div>
          <label
            for="post-content"
            class="block text-xs font-semibold text-slate-700 mb-1"
          >
            Penjelasan & Kebutuhan
          </label>
          <textarea
            id="post-content"
            bind:value={content}
            rows="4"
            placeholder="Ceritakan masalah yang ingin kamu selesaikan..."
            class="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            required
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onclick={onClose}
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Mengirim..." : "Kirim Ide"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
