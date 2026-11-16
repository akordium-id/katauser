<script lang="ts">
  import "../../../../app.css"
  import { writable } from "svelte/store"
  import { setContext } from "svelte"
  import { WebsiteName } from "../../../../config"
  import {
    Building2,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
  } from "lucide-svelte"

  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()

  const adminSectionStore = writable("")
  setContext("adminSection", adminSectionStore)
  let adminSection: string | undefined = $state()
  adminSectionStore.subscribe((value) => {
    adminSection = value
  })

  function closeDrawer(): void {
    const adminDrawer = document.getElementById(
      "admin-drawer",
    ) as HTMLInputElement
    if (adminDrawer) {
      adminDrawer.checked = false
    }
  }
</script>

<div class="drawer lg:drawer-open">
  <input id="admin-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col min-h-screen bg-slate-50/50">
    <div class="navbar bg-white border-b border-slate-200 lg:hidden px-4">
      <div class="flex-1">
        <a
          class="btn btn-ghost normal-case text-lg font-bold text-slate-900"
          href="/"
        >
          {WebsiteName}
        </a>
      </div>
      <div class="flex-none">
        <label
          for="admin-drawer"
          aria-label="Buka menu navigasi"
          class="btn btn-ghost btn-circle text-slate-600"
        >
          <Menu class="h-5 w-5" />
        </label>
      </div>
    </div>
    <div class="flex-1 container px-4 sm:px-8 lg:px-12 py-6 lg:py-8">
      {@render children?.()}
    </div>
  </div>

  <div class="drawer-side">
    <label for="admin-drawer" class="drawer-overlay"></label>
    <div
      class="w-72 min-h-full bg-white border-r border-slate-200 flex flex-col p-4"
    >
      <div
        class="flex items-center justify-between pb-6 pt-2 px-3 border-b border-slate-100"
      >
        <a
          href="/"
          class="flex items-center gap-2 text-lg font-bold text-slate-900"
        >
          <div
            class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm"
          >
            K
          </div>
          <span>{WebsiteName}</span>
        </a>
        <label
          for="admin-drawer"
          aria-label="Tutup menu navigasi"
          class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <X class="w-5 h-5" />
        </label>
      </div>

      <div
        class="px-3 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
      >
        Akun & Manajemen
      </div>

      <ul class="menu p-0 gap-1 text-sm font-medium text-slate-600">
        <li>
          <a
            href="/account"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors {adminSection ===
            'home'
              ? 'bg-indigo-50 font-semibold text-indigo-700'
              : 'hover:bg-slate-100 text-slate-700'}"
            onclick={closeDrawer}
          >
            <Building2
              class="w-4 h-4 shrink-0 {adminSection === 'home'
                ? 'text-indigo-600'
                : 'text-slate-400'}"
            />
            <span>Workspace Hub</span>
          </a>
        </li>
        <li>
          <a
            href="/account/billing"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors {adminSection ===
            'billing'
              ? 'bg-indigo-50 font-semibold text-indigo-700'
              : 'hover:bg-slate-100 text-slate-700'}"
            onclick={closeDrawer}
          >
            <CreditCard
              class="w-4 h-4 shrink-0 {adminSection === 'billing'
                ? 'text-indigo-600'
                : 'text-slate-400'}"
            />
            <span>Langganan & Billing</span>
          </a>
        </li>
        <li>
          <a
            href="/account/settings"
            class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors {adminSection ===
            'settings'
              ? 'bg-indigo-50 font-semibold text-indigo-700'
              : 'hover:bg-slate-100 text-slate-700'}"
            onclick={closeDrawer}
          >
            <Settings
              class="w-4 h-4 shrink-0 {adminSection === 'settings'
                ? 'text-indigo-600'
                : 'text-slate-400'}"
            />
            <span>Pengaturan Akun</span>
          </a>
        </li>
      </ul>

      <div class="mt-auto pt-4 border-t border-slate-100">
        <a
          href="/account/sign_out"
          class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut class="w-4 h-4 shrink-0" />
          <span>Keluar Akun</span>
        </a>
      </div>
    </div>
  </div>
</div>
