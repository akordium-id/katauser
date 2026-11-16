<script lang="ts">
  import { page } from "$app/stores"
  import {
    Layers,
    Inbox,
    Megaphone,
    Globe,
    Webhook,
    Bot,
    Code2,
    ExternalLink,
    LayoutGrid,
    LogOut,
    Menu,
    ChevronRight,
  } from "lucide-svelte"

  interface Props {
    data: {
      workspaceSlug: string
      user: {
        id: string
        name: string
        email: string
        role?: string
      }
    }
    children?: import("svelte").Snippet
  }

  let { data, children }: Props = $props()

  let isMobileOpen = $state(false)

  const currentPath = $derived($page.url.pathname)

  const navItems = $derived([
    {
      label: "Feedback Boards",
      href: `/dashboard/${data.workspaceSlug}/boards`,
      icon: Layers,
    },
    {
      label: "Live Chat Inbox",
      href: `/dashboard/${data.workspaceSlug}/inbox`,
      icon: Inbox,
    },
    {
      label: "Tulis Changelog",
      href: `/dashboard/${data.workspaceSlug}/changelog/new`,
      icon: Megaphone,
    },
  ])

  const settingsItems = $derived([
    {
      label: "Custom Domain",
      href: `/dashboard/${data.workspaceSlug}/settings/domain`,
      icon: Globe,
    },
    {
      label: "Integrasi Webhook",
      href: `/dashboard/${data.workspaceSlug}/settings/integrations`,
      icon: Webhook,
    },
    {
      label: "AI Juno Knowledge",
      href: `/dashboard/${data.workspaceSlug}/settings/ai`,
      icon: Bot,
    },
    {
      label: "Embed Widget",
      href: `/dashboard/${data.workspaceSlug}/settings/widget`,
      icon: Code2,
    },
  ])
</script>

<svelte:head>
  <title>Dashboard {data.workspaceSlug} - Katauser</title>
</svelte:head>

<div class="min-h-screen bg-base-200/50 flex">
  <!-- Desktop Sidebar -->
  <aside
    class="hidden lg:flex flex-col w-64 bg-base-100 border-r border-base-300 shrink-0"
  >
    <!-- Brand / Workspace Switcher -->
    <div class="p-4 border-b border-base-200">
      <a href="/account" class="flex items-center gap-2 group">
        <div
          class="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold text-base shadow-xs"
        >
          K
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1">
            <span class="font-bold text-sm text-base-content truncate"
              >{data.workspaceSlug}</span
            >
            <span
              class="badge badge-primary badge-xs uppercase font-bold text-[10px]"
              >Free</span
            >
          </div>
          <span
            class="text-xs text-base-content/50 hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            <LayoutGrid class="w-3 h-3" />
            <span>Ganti Workspace</span>
          </span>
        </div>
      </a>
    </div>

    <!-- Navigation Links -->
    <div class="flex-1 overflow-y-auto p-3 space-y-6">
      <div>
        <span
          class="px-3 text-[11px] font-bold uppercase tracking-wider text-base-content/40"
        >
          Manajemen Produk
        </span>
        <ul class="mt-2 space-y-1">
          {#each navItems as item (item.href)}
            {@const Icon = item.icon}
            {@const isActive = currentPath.startsWith(item.href)}
            <li>
              <a
                href={item.href}
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors {isActive
                  ? 'bg-primary text-primary-content font-semibold shadow-xs'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
              >
                <Icon class="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <div>
        <span
          class="px-3 text-[11px] font-bold uppercase tracking-wider text-base-content/40"
        >
          Pengaturan
        </span>
        <ul class="mt-2 space-y-1">
          {#each settingsItems as item (item.href)}
            {@const Icon = item.icon}
            {@const isActive = currentPath.startsWith(item.href)}
            <li>
              <a
                href={item.href}
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors {isActive
                  ? 'bg-primary text-primary-content font-semibold shadow-xs'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
              >
                <Icon class="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <div>
        <span
          class="px-3 text-[11px] font-bold uppercase tracking-wider text-base-content/40"
        >
          Portal Publik
        </span>
        <ul class="mt-2 space-y-1 text-xs">
          <li>
            <a
              href="/roadmap/{data.workspaceSlug}"
              target="_blank"
              rel="noreferrer"
              class="flex items-center justify-between px-3 py-2 rounded-lg text-base-content/70 hover:bg-base-200 transition-colors"
            >
              <span>Public Roadmap</span>
              <ExternalLink class="w-3.5 h-3.5 opacity-60" />
            </a>
          </li>
          <li>
            <a
              href="/changelog/{data.workspaceSlug}"
              target="_blank"
              rel="noreferrer"
              class="flex items-center justify-between px-3 py-2 rounded-lg text-base-content/70 hover:bg-base-200 transition-colors"
            >
              <span>Changelog Publik</span>
              <ExternalLink class="w-3.5 h-3.5 opacity-60" />
            </a>
          </li>
        </ul>
      </div>
    </div>

    <!-- User Profile & Sign Out Footer -->
    <div
      class="p-3 border-t border-base-200 bg-base-100 flex items-center justify-between"
    >
      <div class="min-w-0 pr-2">
        <p class="text-xs font-bold text-base-content truncate">
          {data.user.name}
        </p>
        <p class="text-[11px] text-base-content/50 truncate">
          {data.user.email}
        </p>
      </div>
      <a
        href="/account/sign_out"
        class="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
        title="Keluar"
      >
        <LogOut class="w-4 h-4" />
      </a>
    </div>
  </aside>

  <!-- Mobile Drawer / Overlay -->
  {#if isMobileOpen}
    <div class="fixed inset-0 z-50 lg:hidden flex">
      <!-- Backdrop -->
      <button
        type="button"
        onclick={() => (isMobileOpen = false)}
        class="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-default"
        aria-label="Tutup menu"
      ></button>

      <!-- Mobile Sidebar Content -->
      <div
        class="relative w-64 bg-base-100 h-full flex flex-col z-10 shadow-2xl"
      >
        <div
          class="p-4 border-b border-base-200 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold text-base"
            >
              K
            </div>
            <span class="font-bold text-sm text-base-content truncate"
              >{data.workspaceSlug}</span
            >
          </div>
          <button
            onclick={() => (isMobileOpen = false)}
            class="btn btn-ghost btn-xs btn-square"
          >
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-4">
          <ul class="space-y-1">
            {#each navItems as item (item.href)}
              {@const Icon = item.icon}
              {@const isActive = currentPath.startsWith(item.href)}
              <li>
                <a
                  href={item.href}
                  onclick={() => (isMobileOpen = false)}
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium {isActive
                    ? 'bg-primary text-primary-content font-semibold'
                    : 'text-base-content/70 hover:bg-base-200'}"
                >
                  <Icon class="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              </li>
            {/each}
          </ul>

          <div class="divider my-2"></div>

          <ul class="space-y-1">
            {#each settingsItems as item (item.href)}
              {@const Icon = item.icon}
              {@const isActive = currentPath.startsWith(item.href)}
              <li>
                <a
                  href={item.href}
                  onclick={() => (isMobileOpen = false)}
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium {isActive
                    ? 'bg-primary text-primary-content font-semibold'
                    : 'text-base-content/70 hover:bg-base-200'}"
                >
                  <Icon class="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        </div>

        <div
          class="p-3 border-t border-base-200 flex items-center justify-between"
        >
          <span class="text-xs font-semibold text-base-content truncate"
            >{data.user.email}</span
          >
          <a href="/account/sign_out" class="btn btn-ghost btn-xs text-error"
            >Keluar</a
          >
        </div>
      </div>
    </div>
  {/if}

  <!-- Main Content Wrapper -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Topbar -->
    <header
      class="bg-base-100 border-b border-base-300 px-4 py-3 flex items-center justify-between lg:px-8"
    >
      <div class="flex items-center gap-3">
        <button
          onclick={() => (isMobileOpen = true)}
          class="btn btn-ghost btn-sm btn-square lg:hidden"
          aria-label="Buka menu"
        >
          <Menu class="w-5 h-5" />
        </button>

        <nav
          class="flex items-center gap-1.5 text-xs text-base-content/60 font-medium"
        >
          <a href="/account" class="hover:text-primary">Dashboard</a>
          <ChevronRight class="w-3 h-3 opacity-40" />
          <span class="text-base-content font-semibold"
            >{data.workspaceSlug}</span
          >
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <a
          href="/roadmap/{data.workspaceSlug}"
          target="_blank"
          rel="noreferrer"
          class="btn btn-ghost btn-sm text-xs font-semibold hidden sm:inline-flex items-center gap-1.5"
        >
          <span>Preview Roadmap</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>
    </header>

    <!-- Page Content Container -->
    <main class="flex-1 p-4 lg:p-8">
      {@render children?.()}
    </main>
  </div>
</div>
