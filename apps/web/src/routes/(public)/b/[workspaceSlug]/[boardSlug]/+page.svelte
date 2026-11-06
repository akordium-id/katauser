<script lang="ts">
  import PostCard from "$lib/components/feedback/PostCard.svelte"
  import CreatePostModal from "$lib/components/feedback/CreatePostModal.svelte"
  import { createApiClient } from "$lib/api"
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

<div class="min-h-screen bg-slate-50 text-slate-900 antialiased">
  <!-- Header -->
  <header class="border-b border-slate-200/80 bg-white sticky top-0 z-20">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs"
        >
          K
        </div>
        <div>
          <h1 class="text-base font-bold text-slate-900 leading-tight">
            {data.boardName}
          </h1>
          <p class="text-xs text-slate-500 font-medium">
            {data.workspaceSlug}.katauser.com
          </p>
        </div>
      </div>

      <button
        type="button"
        onclick={() => (isModalOpen = true)}
        class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Kirim Ide
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-4xl mx-auto px-4 py-8">
    <!-- Filter & Sort Bar -->
    <div
      class="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4"
    >
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Status:</span
        >
        <div
          class="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg text-xs font-medium text-slate-600"
        >
          <button
            type="button"
            class="px-2.5 py-1 rounded-md {activeStatus === 'all'
              ? 'bg-white shadow-xs text-slate-900 font-semibold'
              : 'hover:text-slate-900'}"
            onclick={() => (activeStatus = "all")}
          >
            Semua
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md {activeStatus === 'planned'
              ? 'bg-white shadow-xs text-slate-900 font-semibold'
              : 'hover:text-slate-900'}"
            onclick={() => (activeStatus = "planned")}
          >
            Planned
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md {activeStatus === 'in_progress'
              ? 'bg-white shadow-xs text-slate-900 font-semibold'
              : 'hover:text-slate-900'}"
            onclick={() => (activeStatus = "in_progress")}
          >
            In Progress
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Urutkan:</span
        >
        <select
          bind:value={activeSort}
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
        >
          <option value="top_voted">Paling Banyak Dipilih</option>
          <option value="newest">Terbaru</option>
        </select>
      </div>
    </div>

    <!-- Posts Feed -->
    {#if posts.length === 0}
      <div
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
      >
        <div class="mx-auto h-12 w-12 text-slate-400 mb-3">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 class="text-sm font-semibold text-slate-900">
          Belum ada ide yang diposting
        </h3>
        <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Jadilah orang pertama yang mengirimkan saran atau fitur baru untuk
          produk ini!
        </p>
        <button
          type="button"
          onclick={() => (isModalOpen = true)}
          class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          Kirim Ide Sekarang
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
</div>
