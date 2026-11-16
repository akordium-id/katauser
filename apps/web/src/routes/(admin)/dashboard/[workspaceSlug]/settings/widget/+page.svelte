<script lang="ts">
  import type { PageData } from "./$types"
  import {
    Code2,
    Copy,
    Check,
    Palette,
    Layers,
    ShieldCheck,
    Sparkles,
    MessageSquare,
    Eye,
    Laptop,
    MapPin,
    SunMoon,
    FileCode2,
    Terminal,
  } from "lucide-svelte"

  let { data }: { data: PageData } = $props()

  let position = $state<"bottom-right" | "bottom-left">("bottom-right")
  let primaryColor = $state("#4f46e5")
  let defaultTab = $state<"feedback" | "roadmap" | "changelog" | "messages">(
    "feedback",
  )
  let theme = $state<"auto" | "light" | "dark">("auto")
  let copiedFormat = $state<string | null>(null)
  let isPreviewOpen = $state(false)

  const PRESET_COLORS = [
    { name: "Indigo", hex: "#4f46e5" },
    { name: "Emerald", hex: "#059669" },
    { name: "Violet", hex: "#7c3aed" },
    { name: "Rose", hex: "#e11d48" },
    { name: "Slate", hex: "#0f172a" },
  ]

  const htmlSnippet = $derived(
    `<!-- Katauser Feedback & Chat Widget -->
<script
  defer
  src="${data.host}/widget/katauser.js"
  data-workspace="${data.workspaceSlug}"
  data-position="${position}"
  data-color="${primaryColor}"
  data-default-tab="${defaultTab}"
  data-theme="${theme}"
><\/script>`,
  )

  const spaSnippet = $derived(
    `import { Katauser } from "@katauser/widget"

// 1. Inisialisasi widget di root layout / App.tsx
Katauser.init({
  workspace: "${data.workspaceSlug}",
  position: "${position}",
  primaryColor: "${primaryColor}",
})

// 2. (Opsional) Identifikasi user login agar MRR terdeteksi
Katauser.identify({
  userId: "usr_12345",
  email: "customer@domain.com",
  name: "Budi Santoso",
  // hash: "HMAC_SHA256_SERVER_HASH", // Opsional untuk security
})`,
  )

  const hmacSnippet = $derived(
    `// Contoh pembuatan HMAC hash di server (Node.js / Edge)
import { createHmac } from "node:crypto"

const secret = process.env.KATAUSER_JWT_SECRET // "${data.demoJwtSecret}"
const userHash = createHmac("sha256", secret)
  .update(currentUser.email)
  .digest("hex")`,
  )

  async function copyToClipboard(text: string, formatId: string) {
    try {
      await navigator.clipboard.writeText(text)
      copiedFormat = formatId
      setTimeout(() => {
        if (copiedFormat === formatId) {
          copiedFormat = null
        }
      }, 2000)
    } catch {
      // Fallback
    }
  }
</script>

<svelte:head>
  <title>Konfigurasi Embed Widget | Katauser Admin</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-8">
  <!-- Page Header -->
  <div class="border-b border-base-300 pb-6">
    <div class="flex items-center gap-2 mb-1">
      <Code2 class="w-6 h-6 text-primary" />
      <h1 class="text-2xl font-bold tracking-tight text-base-content">
        Embed Feedback & Live Chat Widget
      </h1>
    </div>
    <p class="text-sm text-base-content/60">
      Pasang widget interaktif di aplikasi web Anda dengan satu baris tag
      script. Pengguna dapat mengirim saran, memantau roadmap, membaca rilis
      terbaru, dan bertanya ke AI Juno langsung di situs Anda.
    </p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- Left Column: Customizer Controls (7 cols) -->
    <div class="lg:col-span-7 space-y-6">
      <!-- Position & Style Card -->
      <div
        class="card bg-base-100 border border-base-300 shadow-xs p-6 space-y-6"
      >
        <div>
          <h2
            class="text-base font-bold text-base-content flex items-center gap-2"
          >
            <Palette class="w-4 h-4 text-primary" />
            <span>Kustomisasi Tampilan Widget</span>
          </h2>
          <p class="text-xs text-base-content/60 mt-0.5">
            Sesuaikan posisi floating bubble dan warna brand produk Anda.
          </p>
        </div>

        <!-- Position Selector -->
        <div>
          <label
            class="block text-xs font-semibold text-base-content mb-2 flex items-center gap-1.5"
          >
            <MapPin class="w-3.5 h-3.5 text-base-content/50" />
            <span>Posisi Floating Widget di Layar</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              onclick={() => (position = "bottom-right")}
              class="flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all {position ===
              'bottom-right'
                ? 'border-primary bg-primary/5 text-primary shadow-xs'
                : 'border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200/50'}"
            >
              <span>Kanan Bawah (Default)</span>
              <span
                class="w-2.5 h-2.5 rounded-full {position === 'bottom-right'
                  ? 'bg-primary'
                  : 'bg-base-300'}"
              ></span>
            </button>

            <button
              type="button"
              onclick={() => (position = "bottom-left")}
              class="flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all {position ===
              'bottom-left'
                ? 'border-primary bg-primary/5 text-primary shadow-xs'
                : 'border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200/50'}"
            >
              <span>Kiri Bawah</span>
              <span
                class="w-2.5 h-2.5 rounded-full {position === 'bottom-left'
                  ? 'bg-primary'
                  : 'bg-base-300'}"
              ></span>
            </button>
          </div>
        </div>

        <!-- Color Palette -->
        <div>
          <label
            class="block text-xs font-semibold text-base-content mb-2 flex items-center gap-1.5"
          >
            <Palette class="w-3.5 h-3.5 text-base-content/50" />
            <span>Warna Aksen Brand</span>
          </label>
          <div class="flex items-center gap-2.5 flex-wrap">
            {#each PRESET_COLORS as c}
              <button
                type="button"
                onclick={() => (primaryColor = c.hex)}
                title={c.name}
                class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center {primaryColor.toLowerCase() ===
                c.hex.toLowerCase()
                  ? 'border-base-content shadow-xs scale-105'
                  : 'border-transparent'}"
                style="background-color: {c.hex}"
              >
                {#if primaryColor.toLowerCase() === c.hex.toLowerCase()}
                  <Check class="w-4 h-4 text-white drop-shadow-xs" />
                {/if}
              </button>
            {/each}

            <!-- Custom Hex Input -->
            <div
              class="flex items-center ml-2 border border-base-300 rounded-lg px-2.5 py-1 text-xs bg-base-100"
            >
              <span class="text-base-content/40 font-mono mr-1">Hex:</span>
              <input
                type="text"
                bind:value={primaryColor}
                class="w-20 font-mono text-xs text-base-content bg-transparent focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <!-- Default Tab & Theme -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-base-200"
        >
          <div>
            <label
              for="default-tab-select"
              class="block text-xs font-semibold text-base-content mb-1 flex items-center gap-1.5"
            >
              <Layers class="w-3.5 h-3.5 text-base-content/50" />
              <span>Tab Default Dibuka</span>
            </label>
            <select
              id="default-tab-select"
              bind:value={defaultTab}
              class="select select-bordered select-sm w-full text-xs"
            >
              <option value="feedback">Papan Feedback</option>
              <option value="roadmap">Roadmap Fitur</option>
              <option value="changelog">Changelog Rilis</option>
              <option value="messages">AI Juno Live Chat</option>
            </select>
          </div>

          <div>
            <label
              for="theme-select"
              class="block text-xs font-semibold text-base-content mb-1 flex items-center gap-1.5"
            >
              <SunMoon class="w-3.5 h-3.5 text-base-content/50" />
              <span>Mode Tema Tampilan</span>
            </label>
            <select
              id="theme-select"
              bind:value={theme}
              class="select select-bordered select-sm w-full text-xs"
            >
              <option value="auto">Auto (Ikut Sistem/Host)</option>
              <option value="light">Terang (Light)</option>
              <option value="dark">Gelap (Dark)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Code Snippets Section -->
      <div
        class="card bg-base-100 border border-base-300 shadow-xs p-6 space-y-6"
      >
        <div>
          <h2
            class="text-base font-bold text-base-content flex items-center gap-2"
          >
            <FileCode2 class="w-4 h-4 text-primary" />
            <span>Salin Kode Pemasangan</span>
          </h2>
          <p class="text-xs text-base-content/60 mt-0.5">
            Pilih cara integrasi sesuai stack aplikasi web Anda.
          </p>
        </div>

        <!-- HTML Snippet -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="badge badge-sm badge-neutral font-mono text-[10px]"
                >HTML</span
              >
              <span class="text-xs font-semibold text-base-content"
                >Tag Script (Semua Web / WordPress / Shopify / Webflow)</span
              >
            </div>
            <button
              type="button"
              onclick={() => copyToClipboard(htmlSnippet, "html")}
              class="inline-flex items-center gap-1.5 btn btn-ghost btn-xs text-xs font-medium"
            >
              {#if copiedFormat === "html"}
                <Check class="w-3.5 h-3.5 text-success" />
                <span class="text-success font-semibold">Tersalin!</span>
              {:else}
                <Copy class="w-3.5 h-3.5 text-base-content/60" />
                <span>Salin Script</span>
              {/if}
            </button>
          </div>
          <pre
            class="rounded-xl bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800"><code
              >{htmlSnippet}</code
            ></pre>
        </div>

        <!-- SPA / Framework Snippet -->
        <div class="space-y-2 pt-2 border-t border-base-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="badge badge-sm badge-primary font-mono text-[10px]"
                >NPM</span
              >
              <span class="text-xs font-semibold text-base-content"
                >Modern SPA (React / Next.js / Vue / Svelte)</span
              >
            </div>
            <button
              type="button"
              onclick={() => copyToClipboard(spaSnippet, "spa")}
              class="inline-flex items-center gap-1.5 btn btn-ghost btn-xs text-xs font-medium"
            >
              {#if copiedFormat === "spa"}
                <Check class="w-3.5 h-3.5 text-success" />
                <span class="text-success font-semibold">Tersalin!</span>
              {:else}
                <Copy class="w-3.5 h-3.5 text-base-content/60" />
                <span>Salin Kode SPA</span>
              {/if}
            </button>
          </div>
          <pre
            class="rounded-xl bg-slate-900 text-slate-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800"><code
              >{spaSnippet}</code
            ></pre>
        </div>
      </div>

      <!-- Security / HMAC Notice -->
      <div
        class="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-indigo-600 shrink-0" />
            <h3
              class="text-xs font-bold text-indigo-900 uppercase tracking-wider"
            >
              Keamanan Verifikasi Pengguna (HMAC Identity)
            </h3>
          </div>
          <button
            type="button"
            onclick={() => copyToClipboard(hmacSnippet, "hmac")}
            class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            {#if copiedFormat === "hmac"}
              <Check class="w-3 h-3 text-success" />
              <span>Tersalin!</span>
            {:else}
              <Copy class="w-3 h-3" />
              <span>Salin Node.js HMAC</span>
            {/if}
          </button>
        </div>
        <p class="text-xs text-indigo-950/80 leading-relaxed">
          Jika aplikasi Anda mengidentifikasi customer berbayar (MRR) ke
          Katauser, gunakan <code>jwtSecret</code> workspace untuk membuat HMAC hash
          SHA-256 dari email customer di sisi backend. Dengan begitu, user tidak dapat
          memalsukan identitas atau bobot voting mereka.
        </p>
      </div>
    </div>

    <!-- Right Column: Interactive Live Preview Mockup (5 cols) -->
    <div class="lg:col-span-5 space-y-4">
      <div class="flex items-center justify-between">
        <div
          class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/60"
        >
          <Eye class="w-4 h-4 text-primary" />
          <span>Pratinjau Interaktif</span>
        </div>
        <span class="text-[11px] text-base-content/50"
          >Klik bubble untuk buka/tutup</span
        >
      </div>

      <!-- Mock Browser Frame -->
      <div
        class="rounded-2xl border border-base-300 bg-base-100 shadow-md overflow-hidden flex flex-col h-[520px] relative"
      >
        <!-- Mock Browser Topbar -->
        <div
          class="bg-base-200/80 px-4 py-3 border-b border-base-300 flex items-center gap-2 select-none"
        >
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <div class="flex-1 mx-2">
            <div
              class="bg-base-100 border border-base-300 rounded-md px-2.5 py-0.5 text-[10px] text-base-content/60 font-mono truncate"
            >
              https://aplikasianda.com/dashboard
            </div>
          </div>
        </div>

        <!-- Mock Web Content -->
        <div
          class="flex-1 p-5 bg-slate-50/70 overflow-hidden relative select-none"
        >
          <!-- Mock Navbar -->
          <div
            class="flex items-center justify-between pb-3 border-b border-slate-200 mb-4"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded bg-slate-300"></div>
              <div class="w-20 h-3 rounded bg-slate-200"></div>
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-200"></div>
          </div>

          <!-- Mock Dashboard Cards -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div
              class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
            >
              <div class="w-12 h-2.5 rounded bg-slate-200"></div>
              <div class="w-16 h-4 rounded bg-slate-300 font-bold"></div>
            </div>
            <div
              class="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
            >
              <div class="w-14 h-2.5 rounded bg-slate-200"></div>
              <div class="w-12 h-4 rounded bg-slate-300 font-bold"></div>
            </div>
          </div>

          <div
            class="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
          >
            <div class="w-28 h-3 rounded bg-slate-200"></div>
            <div class="w-full h-16 rounded bg-slate-100"></div>
          </div>

          <!-- Floating Trigger Button Simulation -->
          <div
            class="absolute bottom-4 {position === 'bottom-right'
              ? 'right-4'
              : 'left-4'} transition-all duration-300 z-10"
          >
            <button
              type="button"
              onclick={() => (isPreviewOpen = !isPreviewOpen)}
              class="w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              style="background-color: {primaryColor}"
              title="Katauser Widget Trigger"
            >
              {#if isPreviewOpen}
                <span class="text-lg font-bold">✕</span>
              {:else}
                <MessageSquare class="w-5 h-5 drop-shadow-xs" />
              {/if}
            </button>
          </div>

          <!-- Mock Expanded Widget Panel -->
          {#if isPreviewOpen}
            <div
              class="absolute bottom-18 {position === 'bottom-right'
                ? 'right-4'
                : 'left-4'} w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-20 space-y-3 animate-in fade-in zoom-in-95 duration-200"
            >
              <!-- Widget Header -->
              <div
                class="flex items-center justify-between pb-2 border-b border-slate-100"
              >
                <div class="flex items-center gap-1.5">
                  <div
                    class="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                    style="background-color: {primaryColor}"
                  >
                    K
                  </div>
                  <span class="text-xs font-bold text-slate-900"
                    >{data.workspaceSlug}</span
                  >
                </div>
                <span
                  class="badge badge-xs badge-ghost text-[9px] uppercase font-mono"
                  >Live Widget</span
                >
              </div>

              <!-- Widget Tab Pill -->
              <div
                class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium text-slate-600"
              >
                <div
                  class="flex-1 py-1 text-center rounded-md font-semibold text-white shadow-2xs"
                  style="background-color: {primaryColor}"
                >
                  {defaultTab === "feedback"
                    ? "Feedback"
                    : defaultTab === "roadmap"
                      ? "Roadmap"
                      : defaultTab === "changelog"
                        ? "Rilis"
                        : "Juno AI"}
                </div>
                <div class="flex-1 py-1 text-center text-slate-500">
                  {defaultTab === "feedback" ? "Roadmap" : "Feedback"}
                </div>
              </div>

              <!-- Mock Items in Widget -->
              <div class="space-y-2 text-[11px]">
                <div
                  class="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1"
                >
                  <div class="font-semibold text-slate-800 line-clamp-1">
                    Integrasi Discord & Slack Webhook
                  </div>
                  <div
                    class="text-[10px] text-slate-400 flex items-center justify-between"
                  >
                    <span>54 upvotes</span>
                    <span class="text-amber-600 font-medium">In Progress</span>
                  </div>
                </div>

                <div
                  class="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1"
                >
                  <div class="font-semibold text-slate-800 line-clamp-1">
                    Single Sign-On (SSO) SAML
                  </div>
                  <div
                    class="text-[10px] text-slate-400 flex items-center justify-between"
                  >
                    <span>38 upvotes</span>
                    <span class="text-blue-600 font-medium">Planned</span>
                  </div>
                </div>
              </div>

              <!-- Widget Footer -->
              <div
                class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400"
              >
                <span class="flex items-center gap-1">
                  <Sparkles class="w-3 h-3 text-indigo-500" />
                  <span>Didukung AI Juno</span>
                </span>
                <span class="font-semibold text-slate-600">Katauser</span>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
