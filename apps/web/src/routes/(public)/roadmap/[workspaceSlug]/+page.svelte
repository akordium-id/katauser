<script lang="ts">
  import KanbanColumn from "$lib/components/roadmap/KanbanColumn.svelte"
  import { countTotalRoadmapItems } from "$lib/roadmap-helpers"

  let { data } = $props()

  let roadmap = $state({
    planned: [] as any[],
    inProgress: [] as any[],
    completed: [] as any[],
  })

  $effect(() => {
    roadmap = data.roadmap || { planned: [], inProgress: [], completed: [] }
  })

  const totalItems = $derived(countTotalRoadmapItems(roadmap))
</script>

<svelte:head>
  <title>Roadmap | {data.workspaceSlug}</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
  <!-- Header -->
  <header class="border-b border-slate-200/80 bg-white sticky top-0 z-20">
    <div
      class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs"
        >
          K
        </div>
        <div>
          <span
            class="text-xs font-semibold uppercase tracking-wider text-slate-400"
            >Roadmap Publik</span
          >
          <h1 class="text-base font-bold text-slate-900 capitalize">
            {data.workspaceSlug}
          </h1>
        </div>
      </div>

      <!-- Navigation tabs -->
      <nav
        class="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600"
      >
        <a
          href="/b/{data.workspaceSlug}/general"
          class="rounded-lg px-3 py-1.5 transition-colors hover:text-slate-900"
        >
          Feedback
        </a>
        <a
          href="/roadmap/{data.workspaceSlug}"
          class="rounded-lg bg-white px-3 py-1.5 font-semibold text-slate-900 shadow-xs"
        >
          Roadmap
        </a>
        <a
          href="/changelog/{data.workspaceSlug}"
          class="rounded-lg px-3 py-1.5 transition-colors hover:text-slate-900"
        >
          Changelog
        </a>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
    <div
      class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-slate-900">
          Roadmap Produk
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          Transparansi rencana pengembangan dan status fitur terbaru. Total {totalItems}
          item terlacak.
        </p>
      </div>
    </div>

    <!-- Kanban Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <KanbanColumn columnKey="planned" posts={roadmap.planned} />
      <KanbanColumn columnKey="inProgress" posts={roadmap.inProgress} />
      <KanbanColumn columnKey="completed" posts={roadmap.completed} />
    </div>
  </main>
</div>
