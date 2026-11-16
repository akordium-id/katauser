<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"
  import type { PageData, ActionData } from "./$types"
  import {
    Building2,
    LayoutDashboard,
    ExternalLink,
    Plus,
    X,
    Layers,
    ArrowRight,
    Sparkles,
    AlertCircle,
    CheckCircle2,
  } from "lucide-svelte"

  interface Props {
    data: PageData
    form: ActionData
  }

  let { data, form }: Props = $props()

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("home")

  let isModalOpen = $state(false)
  let workspaceName = $state("")
  let workspaceSlug = $state("")
  let isSlugManuallyEdited = $state(false)

  function handleNameInput(e: Event) {
    const target = e.target as HTMLInputElement
    workspaceName = target.value
    if (!isSlugManuallyEdited) {
      workspaceSlug = target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }
  }

  function handleSlugInput(e: Event) {
    const target = e.target as HTMLInputElement
    workspaceSlug = target.value
    isSlugManuallyEdited = true
  }

  function openCreateModal() {
    workspaceName = ""
    workspaceSlug = ""
    isSlugManuallyEdited = false
    isModalOpen = true
  }
</script>

<svelte:head>
  <title>Workspace Hub | Katauser</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8">
  <!-- Page Header -->
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200"
  >
    <div>
      <div class="flex items-center gap-2 mb-1">
        <Building2 class="w-6 h-6 text-indigo-600" />
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Workspace Hub
        </h1>
      </div>
      <p class="text-sm text-slate-500">
        Kelola workspace produk digital Anda, pantau feedback pengguna, dan atur
        integrasi AI Juno.
      </p>
    </div>

    <button
      type="button"
      onclick={openCreateModal}
      class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors self-start sm:self-auto"
    >
      <Plus class="w-4 h-4" />
      <span>Buat Workspace Baru</span>
    </button>
  </div>

  {#if form?.error}
    <div
      class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-center gap-2"
    >
      <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
      <span>{form.error}</span>
    </div>
  {/if}

  <!-- Workspaces Grid -->
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Daftar Workspace ({data.workspaces.length})
      </h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {#each data.workspaces as ws (ws.id)}
        <div
          class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
        >
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shrink-0"
              >
                {ws.name.slice(0, 2).toUpperCase()}
              </div>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {ws.plan || "Free"}
              </span>
            </div>

            <h3
              class="text-base font-bold text-slate-900 group-hover:text-indigo-600"
            >
              {ws.name}
            </h3>

            <p class="text-xs text-slate-500 mt-1 font-mono break-all">
              katauser.com/b/{ws.slug}
            </p>

            <div
              class="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500"
            >
              <span class="inline-flex items-center gap-1.5">
                <Layers class="w-3.5 h-3.5 text-slate-400" />
                <span>{ws.boardsCount ?? 1} Board Aktif</span>
              </span>
              <span>•</span>
              <span
                class="inline-flex items-center gap-1 text-emerald-600 font-medium"
              >
                <CheckCircle2 class="w-3.5 h-3.5" />
                <span>Aktif</span>
              </span>
            </div>
          </div>

          <div
            class="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2"
          >
            <a
              href="/dashboard/{ws.slug}/boards"
              class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <LayoutDashboard class="w-3.5 h-3.5" />
              <span>Buka Dashboard</span>
            </a>
            <a
              href="/b/{ws.slug}"
              target="_blank"
              rel="noreferrer"
              title="Lihat Portal Publik"
              aria-label="Lihat Portal Publik"
              class="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink class="w-4 h-4" />
            </a>
          </div>
        </div>
      {/each}

      <!-- Add New Card CTA -->
      <button
        type="button"
        onclick={openCreateModal}
        class="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition-all text-center min-h-[220px]"
      >
        <div
          class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs mb-3 text-slate-400 group-hover:text-indigo-600"
        >
          <Plus class="w-5 h-5" />
        </div>
        <span class="text-sm font-semibold text-slate-900">
          Buat Workspace Baru
        </span>
        <span class="text-xs text-slate-500 mt-1 max-w-[200px]">
          Tambahkan produk lain untuk mulai mengumpulkan feedback.
        </span>
      </button>
    </div>
  </div>
</div>

<!-- Modal Buat Workspace Baru -->
{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
    >
      <div
        class="flex items-center justify-between pb-3 border-b border-slate-100"
      >
        <div class="flex items-center gap-2">
          <Building2 class="w-5 h-5 text-indigo-600" />
          <h3 class="text-base font-bold text-slate-900">
            Buat Workspace Baru
          </h3>
        </div>
        <button
          type="button"
          onclick={() => (isModalOpen = false)}
          aria-label="Tutup"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <form method="POST" action="?/createWorkspace" class="mt-4 space-y-4">
        <div>
          <label
            for="ws-name"
            class="block text-xs font-semibold text-slate-700 mb-1"
          >
            Nama Workspace / Produk
          </label>
          <input
            id="ws-name"
            name="name"
            type="text"
            value={workspaceName}
            oninput={handleNameInput}
            placeholder="Contoh: Acme SaaS, Layangan App"
            class="input input-bordered w-full text-sm"
            required
          />
        </div>

        <div>
          <label
            for="ws-slug"
            class="block text-xs font-semibold text-slate-700 mb-1"
          >
            Slug URL Publik
          </label>
          <div class="flex items-center">
            <span
              class="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-xs font-mono text-slate-500 select-none"
            >
              katauser.com/b/
            </span>
            <input
              id="ws-slug"
              name="slug"
              type="text"
              value={workspaceSlug}
              oninput={handleSlugInput}
              placeholder="acme-saas"
              class="input input-bordered rounded-l-none w-full text-sm font-mono"
              required
            />
          </div>
          <p class="text-[11px] text-slate-400 mt-1">
            Gunakan huruf kecil, angka, dan tanda hubung (-).
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="btn btn-ghost btn-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            class="inline-flex items-center gap-1.5 btn btn-primary btn-sm px-5"
          >
            <span>Lanjutkan</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
