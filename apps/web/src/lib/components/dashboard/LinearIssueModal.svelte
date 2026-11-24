<script lang="ts">
  import { X, Layers, Plus, Link2, AlertTriangle } from "lucide-svelte"
  import type { LinearIssueResult } from "@katauser/shared"

  interface Props {
    workspaceSlug: string
    postId: string
    postTitle: string
    postContent: string
    isOpen: boolean
    onClose: () => void
    onSuccess?: (issue: LinearIssueResult) => void
  }

  let {
    workspaceSlug,
    postId,
    postTitle,
    postContent,
    isOpen,
    onClose,
    onSuccess,
  }: Props = $props()

  let mode = $state<"create" | "link">("create")
  let title = $state("")
  let description = $state("")
  let teamId = $state("default")
  let priority = $state(0)
  let issueIdOrKey = $state("")
  let isSubmitting = $state(false)
  let errorMessage = $state<string | null>(null)

  $effect(() => {
    if (isOpen) {
      title = postTitle
      description = postContent
      errorMessage = null
    }
  })

  async function handleSubmit() {
    isSubmitting = true
    errorMessage = null

    try {
      if (mode === "create") {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceSlug}/posts/${postId}/issues/linear`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postId,
              teamId: teamId || "default",
              title: title.trim(),
              description: description.trim(),
              priority,
            }),
          },
        )
        const data = await res.json()
        if (res.ok && data.success) {
          onSuccess?.(data.issue)
          onClose()
        } else {
          errorMessage = data.message || "Gagal membuat issue di Linear"
        }
      } else {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceSlug}/posts/${postId}/issues/linear/link`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postId,
              issueIdOrKey: issueIdOrKey.trim().toUpperCase(),
            }),
          },
        )
        const data = await res.json()
        if (res.ok && data.success) {
          onSuccess?.(data.issue)
          onClose()
        } else {
          errorMessage = data.message || "Issue tidak ditemukan di Linear"
        }
      }
    } catch {
      errorMessage = "Terjadi kesalahan jaringan"
    } finally {
      isSubmitting = false
    }
  }
</script>

{#if isOpen}
  <div class="modal modal-open">
    <div class="modal-box max-w-lg p-6 rounded-2xl border border-slate-200">
      <!-- Modal Header -->
      <div
        class="flex items-center justify-between pb-4 border-b border-slate-100"
      >
        <div class="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Layers class="w-5 h-5 text-indigo-600" />
          <span>Linear Issue Tracker</span>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="btn btn-ghost btn-circle btn-sm text-slate-400 hover:text-slate-700"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="flex rounded-lg bg-slate-100 p-1 my-4 text-xs font-semibold">
        <button
          type="button"
          onclick={() => (mode = "create")}
          class="flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition {mode ===
          'create'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}"
        >
          <Plus class="w-3.5 h-3.5" /> Buat Issue Baru
        </button>
        <button
          type="button"
          onclick={() => (mode = "link")}
          class="flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition {mode ===
          'link'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'}"
        >
          <Link2 class="w-3.5 h-3.5" /> Tautkan Issue Existing
        </button>
      </div>

      <!-- Form Body -->
      <div class="space-y-4">
        {#if mode === "create"}
          <div class="form-control">
            <label for="linear-issue-title" class="label py-1">
              <span class="label-text text-xs font-medium text-slate-700"
                >Judul Issue</span
              >
            </label>
            <input
              id="linear-issue-title"
              type="text"
              bind:value={title}
              class="input input-sm input-bordered w-full rounded-lg text-xs"
              placeholder="Judul issue Linear"
            />
          </div>

          <div class="form-control">
            <label for="linear-issue-desc" class="label py-1">
              <span class="label-text text-xs font-medium text-slate-700"
                >Deskripsi</span
              >
            </label>
            <textarea
              id="linear-issue-desc"
              bind:value={description}
              rows="3"
              class="textarea textarea-bordered w-full rounded-lg text-xs"
              placeholder="Deskripsi detail issue"
            ></textarea>
          </div>

          <div class="form-control">
            <label for="linear-issue-priority" class="label py-1">
              <span class="label-text text-xs font-medium text-slate-700"
                >Prioritas</span
              >
            </label>
            <select
              id="linear-issue-priority"
              bind:value={priority}
              class="select select-sm select-bordered w-full rounded-lg text-xs"
            >
              <option value={0}>Tanpa Prioritas (No priority)</option>
              <option value={1}>Urgent</option>
              <option value={2}>High</option>
              <option value={3}>Medium</option>
              <option value={4}>Low</option>
            </select>
          </div>
        {:else}
          <div class="form-control">
            <label for="linear-issue-id" class="label py-1">
              <span class="label-text text-xs font-medium text-slate-700"
                >Identifier Issue</span
              >
              <span class="label-text-alt text-xs text-slate-400"
                >Contoh: ENG-142</span
              >
            </label>
            <input
              id="linear-issue-id"
              type="text"
              bind:value={issueIdOrKey}
              class="input input-sm input-bordered w-full rounded-lg font-mono text-xs uppercase"
              placeholder="ENG-142"
            />
          </div>
        {/if}

        {#if errorMessage}
          <div
            class="alert alert-error text-xs py-2 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle class="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        {/if}
      </div>

      <!-- Modal Actions -->
      <div
        class="modal-action pt-4 border-t border-slate-100 flex justify-end gap-2"
      >
        <button
          type="button"
          onclick={onClose}
          class="btn btn-ghost btn-sm text-xs"
        >
          Batal
        </button>
        <button
          type="button"
          onclick={handleSubmit}
          disabled={isSubmitting}
          class="btn btn-primary btn-sm text-xs px-5"
        >
          {#if isSubmitting}
            <span class="loading loading-spinner loading-xs"></span>
          {:else if mode === "create"}
            Buat di Linear
          {:else}
            Tautkan
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
