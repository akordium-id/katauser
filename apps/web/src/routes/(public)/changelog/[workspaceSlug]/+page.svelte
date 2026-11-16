<script lang="ts">
  import {
    formatChangelogDate,
    getChangelogTagMeta,
  } from "$lib/changelog-helpers"
  import PortalHeader from "$lib/components/portal/PortalHeader.svelte"
  import PortalFooter from "$lib/components/portal/PortalFooter.svelte"
  import { Check } from "lucide-svelte"
  import type { ChangelogItem } from "./+page.server"

  let { data } = $props()

  let changelogs = $state<ChangelogItem[]>([])

  $effect(() => {
    changelogs = data.changelogs || []
  })
</script>

<svelte:head>
  <title>Changelog | {data.workspaceSlug}</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
  <!-- Unified Tenant Portal Header -->
  <PortalHeader
    workspaceSlug={data.workspaceSlug}
    workspaceName={data.workspaceSlug}
    activeTab="changelog"
  />

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
                <Check class="h-3.5 w-3.5 text-emerald-600" />
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

  <PortalFooter />
</div>
