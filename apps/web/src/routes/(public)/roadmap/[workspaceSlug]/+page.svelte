<script lang="ts">
  import KanbanColumn from "$lib/components/roadmap/KanbanColumn.svelte"
  import PortalHeader from "$lib/components/portal/PortalHeader.svelte"
  import PortalFooter from "$lib/components/portal/PortalFooter.svelte"
  import {
    countTotalRoadmapItems,
    type RoadmapData,
  } from "$lib/roadmap-helpers"

  let { data } = $props()

  let roadmap = $state<RoadmapData>({
    planned: [],
    inProgress: [],
    completed: [],
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
  <!-- Unified Tenant Portal Header -->
  <PortalHeader
    workspaceSlug={data.workspaceSlug}
    workspaceName={data.workspaceSlug}
    activeTab="roadmap"
  />

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

  <PortalFooter />
</div>
