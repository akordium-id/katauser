<script lang="ts">
  import { X, GitMerge, AlertTriangle, ArrowRight, Check } from "lucide-svelte"
  import {
    validateMergeTarget,
    calculateMergedSummary,
  } from "$lib/merge-helpers"

  export interface PostItem {
    id: string
    title: string
    votesCount?: number
    totalMrr?: number
    status?: string
  }

  interface Props {
    workspaceSlug?: string
    sourcePost: PostItem
    availablePosts?: PostItem[]
    isOpen: boolean
    onClose: () => void
    onSuccess?: (result: any) => void
  }

  let {
    workspaceSlug = "default",
    sourcePost,
    availablePosts = [],
    isOpen,
    onClose,
    onSuccess,
  }: Props = $props()

  let selectedTargetId = $state("")
  let searchQuery = $state("")
  let isSubmitting = $state(false)
  let errorMessage = $state<string | null>(null)

  $effect(() => {
    if (isOpen) {
      selectedTargetId = ""
      searchQuery = ""
      errorMessage = null
    }
  })

  // Filter candidates: cannot be sourcePost, cannot be already merged
  const candidatePosts = $derived(
    availablePosts
      .filter((p) => p.id !== sourcePost?.id && p.status !== "merged")
      .filter((p) =>
        searchQuery
          ? p.title.toLowerCase().includes(searchQuery.toLowerCase())
          : true,
      ),
  )

  const selectedTargetPost = $derived(
    availablePosts.find((p) => p.id === selectedTargetId),
  )

  const summary = $derived(
    selectedTargetPost
      ? calculateMergedSummary(
          {
            votesCount: sourcePost?.votesCount ?? 0,
            totalMrr: sourcePost?.totalMrr ?? 0,
          },
          {
            votesCount: selectedTargetPost.votesCount ?? 0,
            totalMrr: selectedTargetPost.totalMrr ?? 0,
          },
        )
      : null,
  )

  async function handleMerge() {
    const check = validateMergeTarget(sourcePost?.id || "", selectedTargetId)
    if (!check.valid) {
      errorMessage = check.error
      return
    }

    isSubmitting = true
    errorMessage = null

    try {
      const res = await fetch(`/api/v1/posts/${sourcePost.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPostId: selectedTargetId }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess?.(data)
        onClose()
      } else {
        errorMessage = data.error || data.message || "Gagal menggabungkan post"
      }
    } catch (err: unknown) {
      errorMessage =
        err instanceof Error ? err.message : "Gagal menghubungi server"
    } finally {
      isSubmitting = false
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
    >
      <!-- Modal Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50"
      >
        <div class="flex items-center gap-2 text-slate-800">
          <GitMerge class="w-5 h-5 text-indigo-600" />
          <h2 class="text-base font-semibold">Gabungkan Postingan (Merge)</h2>
        </div>
        <button
          type="button"
          onclick={onClose}
          aria-label="Tutup modal"
          class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-5">
        {#if errorMessage}
          <div
            class="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
          >
            <AlertTriangle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        {/if}

        <!-- Source Post Info -->
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >Post Asal (Akan Digabung)</span
          >
          <p class="text-sm font-medium text-slate-900 line-clamp-2">
            {sourcePost?.title}
          </p>
          <div class="flex items-center gap-3 text-xs text-slate-500 pt-1">
            <span>{sourcePost?.votesCount ?? 0} Votes</span>
            <span>•</span>
            <span>MRR: ${sourcePost?.totalMrr ?? 0}</span>
          </div>
        </div>

        <!-- Target Post Selection -->
        <div class="space-y-2">
          <label
            for="merge-search-input"
            class="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            Pilih Postingan Tujuan (Target)
          </label>
          <input
            id="merge-search-input"
            type="text"
            bind:value={searchQuery}
            placeholder="Ketik untuk mencari judul post..."
            class="input input-sm input-bordered w-full rounded-lg text-xs"
          />

          <div
            class="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100"
          >
            {#if candidatePosts.length === 0}
              <div class="p-4 text-center text-xs text-slate-400">
                Tidak ada post target yang cocok
              </div>
            {:else}
              {#each candidatePosts as post (post.id)}
                <button
                  type="button"
                  onclick={() => (selectedTargetId = post.id)}
                  class="w-full text-left px-3 py-2.5 hover:bg-indigo-50/50 transition-colors flex items-center justify-between text-xs {selectedTargetId ===
                  post.id
                    ? 'bg-indigo-50 text-indigo-900 font-semibold'
                    : 'text-slate-700'}"
                >
                  <div class="truncate pr-2">
                    <p class="truncate">{post.title}</p>
                    <span class="text-[11px] text-slate-400">
                      {post.votesCount ?? 0} votes • ${post.totalMrr ?? 0} MRR
                    </span>
                  </div>
                  {#if selectedTargetId === post.id}
                    <Check class="w-4 h-4 text-indigo-600 shrink-0" />
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <!-- Preview Combined Stats -->
        {#if summary && selectedTargetPost}
          <div
            class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5"
          >
            <span
              class="text-xs font-semibold text-indigo-700 flex items-center gap-1.5"
            >
              <span>Pratinjau Hasil Penggabungan</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </span>
            <div class="flex items-center justify-between text-xs text-indigo-900">
              <span>Total Votes Baru:</span>
              <span class="font-bold">{summary.combinedVotes} Votes</span>
            </div>
            <div class="flex items-center justify-between text-xs text-indigo-900">
              <span>Total Dampak MRR:</span>
              <span class="font-bold">{summary.formattedMrr}</span>
            </div>
            <p class="text-[11px] text-indigo-600/80 pt-1 border-t border-indigo-200/50">
              Voter dari post asal akan dipindahkan ke post target secara otomatis tanpa duplikasi.
            </p>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div
        class="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50"
      >
        <button
          type="button"
          onclick={onClose}
          disabled={isSubmitting}
          class="btn btn-ghost btn-sm text-slate-600 font-medium"
        >
          Batal
        </button>
        <button
          type="button"
          onclick={handleMerge}
          disabled={!selectedTargetId || isSubmitting}
          class="btn btn-primary btn-sm font-semibold shadow-xs gap-1.5"
        >
          {#if isSubmitting}
            <span class="loading loading-spinner loading-xs"></span>
            <span>Menggabungkan...</span>
          {:else}
            <GitMerge class="w-4 h-4" />
            <span>Konfirmasi Gabungkan</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
