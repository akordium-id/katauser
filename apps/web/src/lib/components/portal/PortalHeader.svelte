<script lang="ts">
  import { MessageSquare, Kanban, Sparkles } from "lucide-svelte"

  interface Props {
    workspaceSlug: string
    workspaceName?: string
    activeTab: "feedback" | "roadmap" | "changelog"
    boardSlug?: string
    actions?: import("svelte").Snippet
  }

  let { workspaceSlug, workspaceName, activeTab, boardSlug, actions }: Props =
    $props()

  const displayName = $derived(workspaceName || workspaceSlug)
  const feedbackHref = $derived(
    boardSlug ? `/b/${workspaceSlug}/${boardSlug}` : `/b/${workspaceSlug}`,
  )
</script>

<header
  class="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 transition-all"
>
  <div
    class="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
  >
    <!-- Brand / Tenant Info -->
    <div class="flex items-center gap-3">
      <a href={feedbackHref} class="flex items-center gap-2.5 group">
        <div
          class="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs transition-transform group-hover:scale-105"
        >
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1
            class="text-sm font-bold text-slate-900 leading-tight capitalize group-hover:text-indigo-600 transition-colors"
          >
            {displayName}
          </h1>
          <span class="text-[11px] font-mono text-slate-400">
            {workspaceSlug}.katauser.com
          </span>
        </div>
      </a>
    </div>

    <!-- Navigation Tabs & Actions -->
    <div
      class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto"
    >
      <nav
        class="inline-flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 text-xs font-medium text-slate-600 border border-slate-200/60"
        aria-label="Navigasi Portal Publik"
      >
        <a
          href={feedbackHref}
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all {activeTab ===
          'feedback'
            ? 'bg-white font-semibold text-slate-900 shadow-xs'
            : 'hover:text-slate-900 hover:bg-slate-200/60'}"
        >
          <MessageSquare
            class="w-3.5 h-3.5 {activeTab === 'feedback'
              ? 'text-indigo-600'
              : 'text-slate-400'}"
          />
          <span>Feedback</span>
        </a>

        <a
          href="/roadmap/{workspaceSlug}"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all {activeTab ===
          'roadmap'
            ? 'bg-white font-semibold text-slate-900 shadow-xs'
            : 'hover:text-slate-900 hover:bg-slate-200/60'}"
        >
          <Kanban
            class="w-3.5 h-3.5 {activeTab === 'roadmap'
              ? 'text-indigo-600'
              : 'text-slate-400'}"
          />
          <span>Roadmap</span>
        </a>

        <a
          href="/changelog/{workspaceSlug}"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all {activeTab ===
          'changelog'
            ? 'bg-white font-semibold text-slate-900 shadow-xs'
            : 'hover:text-slate-900 hover:bg-slate-200/60'}"
        >
          <Sparkles
            class="w-3.5 h-3.5 {activeTab === 'changelog'
              ? 'text-indigo-600'
              : 'text-slate-400'}"
          />
          <span>Changelog</span>
        </a>
      </nav>

      {#if actions}
        <div class="shrink-0">
          {@render actions()}
        </div>
      {/if}
    </div>
  </div>
</header>
