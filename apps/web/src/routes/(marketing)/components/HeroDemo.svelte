<script lang="ts">
  interface DemoPost {
    id: string
    title: string
    description: string
    category: string
    status: "planned" | "in_progress" | "completed"
    votes: number
    hasVoted: boolean
    hasAiBadge?: boolean
  }

  let filter = $state<"all" | "planned" | "in_progress" | "completed">("all")

  let posts = $state<DemoPost[]>([
    {
      id: "1",
      title: "Integrasi Webhook Discord & Slack Real-time",
      description: "Kirim notifikasi otomatis ke channel tim saat ada voting atau feedback baru.",
      category: "Integrations",
      status: "in_progress",
      votes: 54,
      hasVoted: false,
    },
    {
      id: "2",
      title: "Dukungan Single Sign-On (SAML / Okta)",
      description: "Otentikasi enterprise untuk manajemen login terpusat tim internal.",
      category: "Security",
      status: "planned",
      votes: 38,
      hasVoted: true,
      hasAiBadge: true,
    },
    {
      id: "3",
      title: "Export Data Feedback ke CSV & Excel",
      description: "Kemudahan unduh rekap insight feedback berkala untuk presentasi stakeholder.",
      category: "Analytics",
      status: "completed",
      votes: 21,
      hasVoted: false,
    },
  ])

  function toggleVote(post: DemoPost) {
    if (post.hasVoted) {
      post.votes -= 1
      post.hasVoted = false
    } else {
      post.votes += 1
      post.hasVoted = true
    }
  }

  const filteredPosts = $derived(
    filter === "all" ? posts : posts.filter((p) => p.status === filter)
  )

  const statusLabel = {
    planned: { label: "Planned", class: "badge-info" },
    in_progress: { label: "In Progress", class: "badge-warning" },
    completed: { label: "Completed", class: "badge-success" },
  }
</script>

<div class="card bg-base-100 border border-base-300 shadow-2xl overflow-hidden rounded-2xl">
  <!-- Mock browser window bar -->
  <div class="bg-base-200/80 px-4 py-3 border-b border-base-300 flex items-center justify-between text-xs text-base-content/60">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full bg-error/70"></span>
      <span class="w-3 h-3 rounded-full bg-warning/70"></span>
      <span class="w-3 h-3 rounded-full bg-success/70"></span>
      <span class="font-mono ml-2 text-base-content/50 hidden sm:inline">feedback.yourcompany.com</span>
    </div>
    <div class="flex items-center gap-1.5 font-medium text-primary">
      <span class="w-2 h-2 rounded-full bg-success animate-pulse"></span>
      <span>Live Interactive Preview</span>
    </div>
  </div>

  <div class="p-4 sm:p-6 space-y-4">
    <!-- Header of mock board -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-base-200">
      <div>
        <h3 class="font-bold text-lg text-base-content">Papan Saran & Masukan Fitur</h3>
        <p class="text-xs text-base-content/60">Klik tombol vote di bawah untuk mencoba interaktivitas langsung.</p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-1">
        <button
          class="btn btn-xs {filter === 'all' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => (filter = "all")}
        >
          Semua
        </button>
        <button
          class="btn btn-xs {filter === 'in_progress' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => (filter = "in_progress")}
        >
          In Progress
        </button>
        <button
          class="btn btn-xs {filter === 'planned' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => (filter = "planned")}
        >
          Planned
        </button>
        <button
          class="btn btn-xs {filter === 'completed' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => (filter = "completed")}
        >
          Completed
        </button>
      </div>
    </div>

    <!-- Posts list -->
    <div class="space-y-3">
      {#each filteredPosts as post (post.id)}
        <div class="p-3 sm:p-4 rounded-xl border border-base-200 hover:border-base-300 bg-base-100 transition-all flex items-start gap-3 sm:gap-4">
          <!-- Upvote button -->
          <button
            onclick={() => toggleVote(post)}
            class="flex flex-col items-center justify-center w-12 sm:w-14 py-2 px-1 rounded-lg border transition-all shrink-0 cursor-pointer {post.hasVoted
              ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
              : 'bg-base-200/50 border-base-300 text-base-content/70 hover:bg-base-200'}"
            title={post.hasVoted ? 'Batal beri vote' : 'Beri vote'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 transition-transform {post.hasVoted ? '-translate-y-0.5' : ''}"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs sm:text-sm mt-0.5">{post.votes}</span>
          </button>

          <!-- Post content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <h4 class="font-semibold text-sm sm:text-base text-base-content leading-snug">{post.title}</h4>
              <span class="badge {statusLabel[post.status].class} badge-xs font-semibold uppercase tracking-wider">
                {statusLabel[post.status].label}
              </span>
            </div>

            <p class="text-xs text-base-content/70 line-clamp-2 leading-relaxed mb-2">
              {post.description}
            </p>

            <div class="flex items-center gap-2 text-xs flex-wrap">
              <span class="badge badge-ghost badge-sm text-xs font-normal">#{post.category}</span>
              {#if post.hasAiBadge}
                <span class="inline-flex items-center gap-1 text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                  ✨ Juno AI: Similar suggestion detected
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

