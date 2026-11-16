<script lang="ts">
  import type { PageData, ActionData } from "./$types"
  import {
    Sparkles,
    Plus,
    X,
    FileText,
    ExternalLink,
    CheckCircle2,
    XCircle,
    FolderOpen,
  } from "lucide-svelte"

  interface KnowledgeDocument {
    id: string
    title: string
    sourceType: string
    sourceUrl?: string | null
    chunksCount?: number
    createdAt: string
  }

  interface Props {
    data: PageData
    form: ActionData
  }

  let { data, form }: Props = $props()

  let documents = $state<KnowledgeDocument[]>([])
  let isAddDocOpen = $state(false)
  let newTitle = $state("")
  let newContent = $state("")
  let newUrl = $state("")

  $effect(() => {
    documents = data.documents || []
  })
</script>

<svelte:head>
  <title>Knowledge Base AI Juno | Katauser Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <Sparkles class="w-5 h-5 text-indigo-600" />
        <h2 class="text-xl font-bold tracking-tight text-slate-900">
          Basis Pengetahuan AI Juno (RAG)
        </h2>
      </div>
      <p class="text-sm text-slate-500">
        Kelola artikel dokumentasi, panduan fitur, dan FAQ agar AI Juno dapat
        menjawab pertanyaan pengguna dengan presisi.
      </p>
    </div>

    <button
      type="button"
      onclick={() => (isAddDocOpen = true)}
      class="inline-flex items-center justify-center gap-2 btn btn-primary btn-sm px-4 self-start sm:self-auto"
    >
      <Plus class="w-4 h-4" />
      <span>Tambah Dokumen / FAQ</span>
    </button>
  </div>

  {#if form?.error}
    <div class="alert alert-error text-xs flex items-center gap-2">
      <XCircle class="w-4 h-4 shrink-0" />
      <span>{form.error}</span>
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success text-xs flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Documents Grid -->
  <div>
    {#if documents.length === 0}
      <div
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
      >
        <FolderOpen class="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 class="text-sm font-semibold text-slate-900">
          Belum ada basis pengetahuan
        </h3>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Tambahkan URL artikel atau teks panduan produk agar Juno mulai
          mempelajari aplikasi Anda.
        </p>
        <button
          type="button"
          onclick={() => (isAddDocOpen = true)}
          class="inline-flex items-center gap-2 mt-4 btn btn-outline btn-sm text-xs"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Dokumen Pertama</span>
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each documents as doc (doc.id)}
          <div class="card bg-base-100 border border-slate-200 shadow-xs p-5">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-indigo-600 shrink-0" />
                <h3 class="text-sm font-bold text-slate-900 line-clamp-1">{doc.title}</h3>
              </div>
              <span class="badge badge-sm badge-info font-mono text-[10px]"
                >{doc.chunksCount || 1} Chunks</span
              >
            </div>

            {#if doc.sourceUrl}
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mb-3 truncate font-mono"
              >
                <span class="truncate">{doc.sourceUrl}</span>
                <ExternalLink class="w-3 h-3 shrink-0" />
              </a>
            {/if}

            <div
              class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400"
            >
              <span class="uppercase tracking-wider text-[10px] font-semibold text-slate-500">Tipe: {doc.sourceType}</span>
              <span class="badge badge-xs badge-success">Aktif di RAG</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Add Document Modal -->
  {#if isAddDocOpen}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
      >
        <div
          class="flex items-center justify-between pb-3 border-b border-slate-100"
        >
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-indigo-600" />
            <h3 class="text-base font-bold text-slate-900">
              Tambah Dokumen ke AI Juno
            </h3>
          </div>
          <button
            type="button"
            onclick={() => (isAddDocOpen = false)}
            aria-label="Tutup"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <form method="POST" action="?/ingest" class="mt-4 space-y-4">
          <div>
            <label
              for="doc-title"
              class="block text-xs font-semibold text-slate-700 mb-1"
              >Judul Dokumen / FAQ</label
            >
            <input
              id="doc-title"
              name="title"
              type="text"
              bind:value={newTitle}
              placeholder="Contoh: Cara Konfigurasi Webhook Slack"
              class="input input-bordered w-full text-sm"
              required
            />
          </div>

          <div>
            <label
              for="doc-url"
              class="block text-xs font-semibold text-slate-700 mb-1"
              >URL Sumber (Opsional)</label
            >
            <input
              id="doc-url"
              name="sourceUrl"
              type="url"
              bind:value={newUrl}
              placeholder="https://docs.acme.com/webhooks"
              class="input input-bordered w-full text-sm font-mono"
            />
          </div>

          <div>
            <label
              for="doc-content"
              class="block text-xs font-semibold text-slate-700 mb-1"
              >Isi Dokumen / Panduan</label
            >
            <textarea
              id="doc-content"
              name="content"
              bind:value={newContent}
              rows="6"
              placeholder="Tuliskan penjelasan produk, instruksi langkah-demi-langkah, atau jawaban FAQ..."
              class="textarea textarea-bordered w-full text-sm font-sans"
              required
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onclick={() => (isAddDocOpen = false)}
              class="btn btn-ghost btn-sm"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-primary btn-sm px-5">
              Simpan & Vektorisasi
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
