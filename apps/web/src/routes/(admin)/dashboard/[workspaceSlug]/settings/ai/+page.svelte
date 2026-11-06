<script lang="ts">
  import type { PageData, ActionData } from "./$types"

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
  <title>Knowledge Base AI Juno | Katauser</title>
</svelte:head>

<div class="max-w-5xl mx-auto py-8 px-4">
  <!-- Header -->
  <div class="flex items-center justify-between pb-6 border-b border-gray-200">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        Basis Pengetahuan AI Juno (RAG)
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Kelola artikel dokumentasi, panduan fitur, dan FAQ agar AI Juno dapat
        menjawab pertanyaan pengguna dengan presisi.
      </p>
    </div>

    <button
      type="button"
      onclick={() => (isAddDocOpen = true)}
      class="btn btn-primary btn-sm px-4"
    >
      + Tambah Dokumen / FAQ
    </button>
  </div>

  {#if form?.error}
    <div class="alert alert-error my-6">
      <span>{form.error}</span>
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success my-6">
      <span>{form.message}</span>
    </div>
  {/if}

  <!-- Documents Grid -->
  <div class="mt-8">
    {#if documents.length === 0}
      <div
        class="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center"
      >
        <h3 class="text-sm font-semibold text-gray-900">
          Belum ada basis pengetahuan
        </h3>
        <p class="text-xs text-gray-500 mt-1">
          Tambahkan URL artikel atau teks panduan produk agar Juno mulai
          mempelajari aplikasi Anda.
        </p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each documents as doc (doc.id)}
          <div class="card bg-base-100 border border-gray-200 shadow-sm p-5">
            <div class="flex items-start justify-between mb-2">
              <h3 class="text-base font-bold text-gray-900">{doc.title}</h3>
              <span class="badge badge-sm badge-info"
                >{doc.chunksCount || 1} Chunks Vektor</span
              >
            </div>

            {#if doc.sourceUrl}
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noreferrer"
                class="text-xs text-blue-600 hover:underline mb-3 truncate block font-mono"
              >
                {doc.sourceUrl}
              </a>
            {/if}

            <div
              class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400"
            >
              <span>Tipe: {doc.sourceType.toUpperCase()}</span>
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
        class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100"
      >
        <div
          class="flex items-center justify-between pb-3 border-b border-gray-100"
        >
          <h2 class="text-base font-bold text-gray-900">
            Tambah Dokumen ke AI Juno
          </h2>
          <button
            type="button"
            onclick={() => (isAddDocOpen = false)}
            aria-label="Tutup"
            class="p-1 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form method="POST" action="?/ingest" class="mt-4 space-y-4">
          <div>
            <label
              for="doc-title"
              class="block text-xs font-semibold text-gray-700 mb-1"
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
              class="block text-xs font-semibold text-gray-700 mb-1"
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
              class="block text-xs font-semibold text-gray-700 mb-1"
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
