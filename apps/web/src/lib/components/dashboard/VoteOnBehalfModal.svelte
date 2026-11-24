<script lang="ts">
  import {
    X,
    UserCheck,
    AlertTriangle,
    Building2,
    DollarSign,
  } from "lucide-svelte"
  import { formatVoteOnBehalfPayload } from "$lib/merge-helpers"

  export interface VoteOnBehalfResult {
    success: boolean
    message?: string
    post?: {
      id: string
      title?: string
      votesCount?: number
      totalMrr?: number
    }
    vote?: unknown
  }

  interface Props {
    workspaceSlug?: string
    post: {
      id: string
      title: string
      votesCount?: number
      totalMrr?: number
    }
    isOpen: boolean
    onClose: () => void
    onSuccess?: (result: VoteOnBehalfResult) => void
  }

  let { post, isOpen, onClose, onSuccess }: Props = $props()

  let customerEmail = $state("")
  let customerName = $state("")
  let company = $state("")
  let mrrStr = $state("")
  let internalNote = $state("")
  let isSubmitting = $state(false)
  let errorMessage = $state<string | null>(null)

  $effect(() => {
    if (isOpen) {
      customerEmail = ""
      customerName = ""
      company = ""
      mrrStr = ""
      internalNote = ""
      errorMessage = null
    }
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!customerEmail.trim()) {
      errorMessage = "Email customer wajib diisi"
      return
    }

    const payload = formatVoteOnBehalfPayload({
      customerEmail,
      customerName,
      company,
      mrrStr,
      internalNote,
    })

    isSubmitting = true
    errorMessage = null

    try {
      const res = await fetch(`/api/v1/posts/${post.id}/vote-on-behalf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess?.(data)
        onClose()
      } else {
        errorMessage =
          data.error ||
          data.message ||
          data.errors?.[0]?.message ||
          "Gagal mencatatkan vote"
      }
    } catch (err: unknown) {
      errorMessage =
        err instanceof Error ? err.message : "Gagal menghubungi server"
    } finally {
      isSubmitting = false
    }
  }
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && isOpen && onClose()} />

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    role="dialog"
    aria-modal="true"
    aria-labelledby="vote-behalf-modal-title"
  >
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
    >
      <!-- Modal Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50"
      >
        <div class="flex items-center gap-2 text-slate-800">
          <UserCheck class="w-5 h-5 text-indigo-600" />
          <h2 id="vote-behalf-modal-title" class="text-base font-semibold">
            Vote atas Nama Pelanggan
          </h2>
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

      <!-- Form Body -->
      <form onsubmit={handleSubmit} class="p-6 space-y-4">
        {#if errorMessage}
          <div
            class="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium"
          >
            <AlertTriangle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        {/if}

        <!-- Post Title summary -->
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span
            class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider"
            >Post Sasaran</span
          >
          <p class="text-xs font-medium text-slate-800 line-clamp-1 mt-0.5">
            {post?.title}
          </p>
        </div>

        <!-- Customer Email (Required) -->
        <div class="space-y-1">
          <label
            for="vote-customer-email"
            class="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            Email Customer <span class="text-rose-500">*</span>
          </label>
          <input
            id="vote-customer-email"
            type="email"
            required
            bind:value={customerEmail}
            placeholder="contoh: client@enterprise.com"
            class="input input-sm input-bordered w-full rounded-lg text-xs"
          />
        </div>

        <!-- Name & Company in 2 cols -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label
              for="vote-customer-name"
              class="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Nama
            </label>
            <input
              id="vote-customer-name"
              type="text"
              bind:value={customerName}
              placeholder="Budi Hartono"
              class="input input-sm input-bordered w-full rounded-lg text-xs"
            />
          </div>
          <div class="space-y-1">
            <label
              for="vote-company"
              class="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
            >
              Perusahaan
            </label>
            <div class="relative">
              <input
                id="vote-company"
                type="text"
                bind:value={company}
                placeholder="PT Maju"
                class="input input-sm input-bordered w-full rounded-lg text-xs pr-7"
              />
              <Building2
                class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"
              />
            </div>
          </div>
        </div>

        <!-- Monthly Recurring Revenue (MRR) -->
        <div class="space-y-1">
          <label
            for="vote-mrr"
            class="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            Dampak MRR Customer ($ USD)
          </label>
          <div class="relative">
            <input
              id="vote-mrr"
              type="number"
              min="0"
              step="any"
              bind:value={mrrStr}
              placeholder="0 (misal: 1500)"
              class="input input-sm input-bordered w-full rounded-lg text-xs pr-7"
            />
            <DollarSign
              class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none"
            />
          </div>
        </div>

        <!-- Internal Note -->
        <div class="space-y-1">
          <label
            for="vote-internal-note"
            class="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            Catatan Internal Sales / CS
          </label>
          <textarea
            id="vote-internal-note"
            rows="2"
            bind:value={internalNote}
            placeholder="Contoh: Diminta saat renewal call Q4. Deal blocker jika belum ada."
            class="textarea textarea-sm textarea-bordered w-full rounded-lg text-xs resize-none"
          ></textarea>
        </div>

        <!-- Modal Footer Buttons inside form -->
        <div
          class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100"
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
            type="submit"
            disabled={!customerEmail.trim() || isSubmitting}
            class="btn btn-primary btn-sm font-semibold shadow-xs gap-1.5"
          >
            {#if isSubmitting}
              <span class="loading loading-spinner loading-xs"></span>
              <span>Menyimpan...</span>
            {:else}
              <UserCheck class="w-4 h-4" />
              <span>Simpan Vote</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
