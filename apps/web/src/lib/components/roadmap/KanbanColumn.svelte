<script lang="ts">
  import { getColumnMeta, type RoadmapColumnKey } from '$lib/roadmap-helpers';

  let {
    columnKey,
    posts = [],
  }: {
    columnKey: RoadmapColumnKey;
    posts: Array<{
      id: string;
      title: string;
      content: string;
      status: string;
      votesCount: number;
      commentsCount: number;
    }>;
  } = $props();

  const meta = $derived(getColumnMeta(columnKey));
</script>

<div class="flex flex-col min-w-[300px] flex-1 rounded-2xl bg-slate-50/70 border border-slate-200/80 p-4">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border {meta.badgeClass}">
        {meta.title}
      </span>
      <span class="text-xs text-slate-500 font-medium">
        {posts.length}
      </span>
    </div>
  </div>

  <div class="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
    {#if posts.length === 0}
      <div class="rounded-xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-xs text-slate-400">
        Belum ada item di kolom ini
      </div>
    {:else}
      {#each posts as post (post.id)}
        <div class="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
          <div class="flex items-start justify-between gap-3 mb-2">
            <h4 class="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {post.title}
            </h4>
            <span class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              </svg>
              {post.votesCount}
            </span>
          </div>

          <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
            {post.content}
          </p>

          <div class="flex items-center gap-3 text-[11px] text-slate-400">
            <span class="inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.commentsCount} komentar
            </span>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

