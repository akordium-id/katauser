<script lang="ts">
  import { createApiClient } from "$lib/api"

  let { data } = $props()

  let title = $state("")
  let slug = $state("")
  let content = $state("")
  let selectedPostIds = $state<string[]>([])
  let loading = $state(false)
  let error = $state<string | null>(null)
  let success = $state(false)

  // Auto-generate slug from title if user hasn't typed custom slug
  let isSlugManual = $state(false)

  function handleTitleChange(val: string) {
    title = val
    if (!isSlugManual) {
      slug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
    }
  }

  function togglePostSelection(postId: string) {
    if (selectedPostIds.includes(postId)) {
      selectedPostIds = selectedPostIds.filter((id) => id !== postId)
    } else {
      selectedPostIds = [...selectedPostIds, postId]
    }
  }

  const api = createApiClient()

  async function handlePublish(e: SubmitEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim() || !content.trim()) {
      error = "Judul, slug, dan isi konten changelog wajib diisi."
      return
    }

    loading = true
    error = null
    success = false

    try {
      const res = await api.api.v1.workspaces[":slug"].changelogs.$post({
        param: { slug: data.workspaceSlug },
        json: {
          title,
          slug,
          content,
          postIds: selectedPostIds,
          publishedAt: new Date().toISOString(),
        },
      })

      if (res.ok) {
        success = true
        title = ""
        slug = ""
        content = ""
        selectedPostIds = []
        isSlugManual = false
      } else {
        const errData = (await res.json()) as {
          errors?: Array<{ message?: string }>
        }
        error =
          errData.errors?.[0]?.message || "Gagal mempublikasikan changelog."
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : "Gagal menghubungi server."
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Publikasikan Changelog | Katauser Admin</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 antialiased p-6 sm:p-10">
  <div class="max-w-3xl mx-auto">
    <!-- Breadcrumb & Nav -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-slate-500">
        <a
          href="/dashboard/{data.workspaceSlug}/boards"
          class="hover:text-slate-900">Admin</a
        >
        <span>/</span>
        <span class="font-medium text-slate-900">Buat Changelog Baru</span>
      </div>
      <a
        href="/changelog/{data.workspaceSlug}"
        target="_blank"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        <span>Lihat Portal Publik</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>

    {#if success}
      <div
        class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-emerald-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span
            >Changelog berhasil dipublikasikan dan voter notifikasi siap
            dikirim!</span
          >
        </div>
        <a
          href="/changelog/{data.workspaceSlug}"
          class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
        >
          Buka Changelog
        </a>
      </div>
    {/if}

    {#if error}
      <div
        class="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
      >
        {error}
      </div>
    {/if}

    <form
      onsubmit={handlePublish}
      class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
    >
      <div>
        <h2 class="text-xl font-bold text-slate-900">
          Publikasikan Catatan Rilis
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          Tuliskan pembaruan yang siap diumumkan ke pengguna dan hubungkan ke
          feedback request yang telah diselesaikan.
        </p>
      </div>

      <!-- Title Input -->
      <div>
        <label
          for="changelog-title"
          class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
        >
          Judul Rilis
        </label>
        <input
          id="changelog-title"
          type="text"
          value={title}
          oninput={(e) =>
            handleTitleChange((e.target as HTMLInputElement).value)}
          placeholder="e.g. Versi 1.3: Integrasi Notifikasi Slack"
          class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          required
        />
      </div>

      <!-- Slug Input -->
      <div>
        <label
          for="changelog-slug"
          class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
        >
          URL Slug
        </label>
        <div
          class="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
        >
          <span class="text-xs text-slate-400"
            >/changelog/{data.workspaceSlug}/</span
          >
          <input
            id="changelog-slug"
            type="text"
            bind:value={slug}
            oninput={() => (isSlugManual = true)}
            placeholder="versi-1-3"
            class="flex-1 bg-transparent border-0 p-0 text-slate-900 focus:ring-0 focus:outline-hidden text-sm ml-1"
            required
          />
        </div>
      </div>

      <!-- Content Markdown -->
      <div>
        <label
          for="changelog-content"
          class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
        >
          Konten Catatan Rilis
        </label>
        <textarea
          id="changelog-content"
          bind:value={content}
          rows={6}
          placeholder="Jelaskan fitur baru, perbaikan bug, atau instruksi penggunaan bagi user..."
          class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          required
        ></textarea>
      </div>

      <!-- Link Completed Feedback Posts -->
      <div>
        <span
          class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
        >
          Tautkan Ide / Request Selesai (Auto-Notify Voters)
        </span>
        {#if data.completedPosts.length === 0}
          <p class="text-xs text-slate-400 italic">
            Belum ada post dengan status 'completed' yang siap ditautkan.
          </p>
        {:else}
          <div
            class="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50"
          >
            {#each data.completedPosts as post (post.id)}
              <label
                class="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200/80 cursor-pointer hover:border-slate-300"
              >
                <input
                  type="checkbox"
                  checked={selectedPostIds.includes(post.id)}
                  onchange={() => togglePostSelection(post.id)}
                  class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold text-slate-900 truncate">
                    {post.title}
                  </div>
                  <div class="text-[11px] text-slate-400">
                    {post.votesCount} voters didaftarkan
                  </div>
                </div>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Submit button -->
      <div class="pt-4 border-t border-slate-100 flex items-center justify-end">
        <button
          type="submit"
          disabled={loading}
          class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
        >
          {#if loading}
            <svg
              class="h-4 w-4 animate-spin text-white"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span>Mempublikasikan...</span>
          {:else}
            <span>Publikasikan Sekarang</span>
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
