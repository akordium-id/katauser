<script lang="ts">
  import {
    formatChangelogDate,
    getChangelogTagMeta,
  } from "$lib/changelog-helpers"

  let { data } = $props()

  let changelogs = $state<any[]>([])

  $effect(() => {
    changelogs = data.changelogs || []
  })
</script>

<svelte:head>
  <title>Changelog | {data.workspaceSlug}</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
  <!-- Header -->
  <header class="border-b border-slate-200/80 bg-white sticky top-0 z-20">
    <div
      class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between"
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
            >Changelog Publik</span
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
          class="rounded-lg px-3 py-1.5 transition-colors hover:text-slate-900"
        >
          Roadmap
        </a>
        <a
          href="/changelog/{data.workspaceSlug}"
          class="rounded-lg bg-white px-3 py-1.5 font-semibold text-slate-900 shadow-xs"
        >
          Changelog
        </a>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
    <div class="mb-10 text-center sm:text-left">
      <h2 class="text-3xl font-extrabold tracking-tight text-slate-900">
        Catatan Rilis & Pembaruan
      </h2>
      <p class="mt-2 text-sm text-slate-500">
        Semua pembaruan fitur, peningkatan performa, dan perbaikan bug yang kami
        luncurkan untuk Anda.
      </p>
    </div>

    <!-- Timeline Releases -->
    <div class="relative border-l border-slate-200 ml-4 sm:ml-6 space-y-12">
      {#each changelogs as release (release.id)}
        {@const tagMeta = getChangelogTagMeta(release.tag || "feature")}
        <article class="relative pl-6 sm:pl-8 group">
          <!-- Timeline node dot -->
          <div
            class="absolute -left-2 top-1.5 h-4 w-4 rounded-full border-2 border-white bg-indigo-600 shadow-xs"
          ></div>

          <header
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3"
          >
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {tagMeta.badgeClass}"
              >
                {tagMeta.label}
              </span>
              <time
                datetime={release.publishedAt}
                class="text-xs font-medium text-slate-400"
              >
                {formatChangelogDate(release.publishedAt)}
              </time>
            </div>

            {#if release.postIds && release.postIds.length > 0}
              <div
                class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100"
              >
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span
                  >Menyelesaikan {release.postIds.length} request pengguna</span
                >
              </div>
            {/if}
          </header>

          <h3 class="text-xl font-bold text-slate-900 mb-2">
            {release.title}
          </h3>

          <div
            class="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs"
          >
            {release.content}
          </div>
        </article>
      {/each}
    </div>
  </main>
</div>
