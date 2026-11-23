<script lang="ts">
  import PostCard from "$lib/components/feedback/PostCard.svelte"
  import CreatePostModal from "$lib/components/feedback/CreatePostModal.svelte"
  import PortalHeader from "$lib/components/portal/PortalHeader.svelte"
  import PortalFooter from "$lib/components/portal/PortalFooter.svelte"
  import { createApiClient } from "$lib/api"
  import { Plus } from "lucide-svelte"
  import type { FeedbackPostItem } from "./+page.server"

  let { data } = $props()

  let posts = $state<FeedbackPostItem[]>([])
  let isModalOpen = $state(false)
  let activeSort = $state("top_voted")
  let activeStatus = $state("all")

  $effect(() => {
    posts = data.posts || []
    activeSort = data.sort || "top_voted"
    activeStatus = data.status || "all"
  })

  const api = createApiClient()

  async function handleVote(postId: string) {
    // Optimistic UI update
    const postIndex = posts.findIndex((p) => p.id === postId)
    if (postIndex === -1) return

    try {
      const res = await api.api.v1.posts[":postId"].vote.$post({
        param: { postId },
      })
      if (res.ok) {
        const { votesCount } = await res.json()
        posts[postIndex].votesCount = votesCount
      }
    } catch (err) {
      console.error("Failed to vote:", err)
    }
  }

  async function handleCreatePost(newPostData: {
    title: string
    content: string
  }) {
    try {
      const res = await api.api.v1.boards[":boardId"].posts.$post({
        param: { boardId: data.boardSlug || "default_board" },
        json: {
          boardId: data.boardSlug || "default_board",
          title: newPostData.title,
          content: newPostData.content,
        },
      })
      if (res.ok) {
        const { post } = await res.json()
        posts = [post, ...posts]
      }
    } catch (err) {
      console.error("Failed to create post:", err)
    }
  }
</script>

<svelte:head>
  <title>{data.boardName} | {data.workspaceSlug}</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
  <!-- Unified Tenant Portal Header -->
  <PortalHeader
    workspaceSlug={data.workspaceSlug}
    workspaceName={data.workspaceSlug}
    activeTab="feedback"
    boardSlug={data.boardSlug}
  >
    {#snippet actions()}
      <button
        type="button"
        onclick={() => (isModalOpen = true)}
        class="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
      >
        <Plus class="w-4 h-4" />
        <span>Kirim Ide</span>
      </button>
    {/snippet}
  </PortalHeader>

  <!-- Main Content -->
  <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
    <!-- Board Info Title -->
    <div
      class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
    >
      <div>
        <h2 class="text-xl font-bold tracking-tight text-slate-900">
          {data.boardName}
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Suarakan saran fitur, berikan suara pada ide pengguna lain, dan bantu
          kami menentukan prioritas rilis.
        </p>
      </div>
    </div>

    <!-- Filter & Sort Bar -->
    <div
      class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4"
    >
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Status:</span
        >
        <div class="flex items-center gap-1">
          <a
            href="?status=all&sort={activeSort}"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {activeStatus ===
            'all'
              ? 'bg-slate-200 text-slate-800'
              : 'text-slate-600 hover:bg-slate-100'}"
          >
            Semua
          </a>
          <a
            href="?status=planned&sort={activeSort}"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {activeStatus ===
            'planned'
              ? 'bg-blue-100 text-blue-800'
              : 'text-slate-600 hover:bg-slate-100'}"
          >
            Planned
          </a>
          <a
            href="?status=in_progress&sort={activeSort}"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {activeStatus ===
            'in_progress'
              ? 'bg-amber-100 text-amber-800'
              : 'text-slate-600 hover:bg-slate-100'}"
          >
            In Progress
          </a>
          <a
            href="?status=completed&sort={activeSort}"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {activeStatus ===
            'completed'
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-slate-600 hover:bg-slate-100'}"
          >
            Completed
          </a>
          <a
            href="?status=merged&sort={activeSort}"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {activeStatus ===
            'merged'
              ? 'bg-amber-100 text-amber-800'
              : 'text-slate-600 hover:bg-slate-100'}"
          >
            Merged
          </a>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Urutan:</span
        >
        <select
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden"
          value={activeSort}
          onchange={(e) => {
            const target = e.target as HTMLSelectElement
            window.location.search = `?sort=${target.value}&status=${activeStatus}`
          }}
        >
          <option value="top_voted">Suara Terbanyak</option>
          <option value="newest">Terbaru</option>
        </select>
      </div>
    </div>

    <!-- Posts Feed -->
    {#if posts.length === 0}
      <div
        class="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center"
      >
        <h3 class="text-sm font-semibold text-slate-900">Belum Ada Masukan</h3>
        <p class="mt-1 text-xs text-slate-500">
          Jadilah orang pertama yang mengirimkan ide atau saran untuk produk
          ini!
        </p>
        <button
          type="button"
          onclick={() => (isModalOpen = true)}
          class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          <Plus class="w-4 h-4" />
          <span>Kirim Ide Sekarang</span>
        </button>
      </div>
    {:else}
      <div class="space-y-3">
        {#each posts as post (post.id)}
          <PostCard {post} onVote={handleVote} />
        {/each}
      </div>
    {/if}
  </main>

  <CreatePostModal
    isOpen={isModalOpen}
    onClose={() => (isModalOpen = false)}
    onSubmit={handleCreatePost}
  />

  <PortalFooter />
</div>
