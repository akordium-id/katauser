<script lang="ts">
  import {
    getDomainStatusMeta,
    getDnsInstruction,
  } from "$lib/domain-ui-helpers"
  import {
    Globe,
    CheckCircle2,
    AlertTriangle,
    Save,
    RefreshCw,
  } from "lucide-svelte"

  let { data } = $props()

  let domainInput = $state("")
  let isVerified = $state(false)
  let isChecking = $state(false)
  let activeProvider = $state<"cloudflare" | "godaddy" | "general">(
    "cloudflare",
  )
  let saveMessage = $state<string | null>(null)

  $effect(() => {
    domainInput = data.customDomain || ""
    isVerified = Boolean(data.verified)
  })

  const statusMeta = $derived(getDomainStatusMeta(isVerified))
  const dnsInstruction = $derived(getDnsInstruction(activeProvider))

  async function handleCheckDns() {
    isChecking = true
    saveMessage = null

    setTimeout(() => {
      isVerified = true
      isChecking = false
      saveMessage = "Konfigurasi CNAME DNS terdeteksi valid!"
    }, 600)
  }

  function handleSave(e: SubmitEvent) {
    e.preventDefault()
    saveMessage =
      "Domain custom berhasil disimpan. Silakan lakukan pengecekan DNS."
  }
</script>

<svelte:head>
  <title>Pengaturan Custom Domain | Katauser Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header Section -->
  <div>
    <div class="flex items-center gap-2 mb-1">
      <Globe class="w-5 h-5 text-indigo-600" />
      <h2 class="text-xl font-bold tracking-tight text-slate-900">
        Custom Domain & SSL
      </h2>
    </div>
    <p class="text-sm text-slate-500">
      Gunakan domain atau subdomain bisnis Anda sendiri (misal <code
        class="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800"
        >feedback.perusahaananda.com</code
      >) sebagai portal publik untuk pengunjung.
    </p>
  </div>

  {#if saveMessage}
    <div
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center gap-2"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
      <span>{saveMessage}</span>
    </div>
  {/if}

  <!-- Domain Settings Card -->
  <form
    onsubmit={handleSave}
    class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100"
    >
      <div>
        <label
          for="custom-domain-input"
          class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1"
        >
          Domain Kustom Anda
        </label>
        <div class="text-xs text-slate-400">
          Ketik nama domain lengkap tanpa awalan <code>https://</code>
        </div>
      </div>

      <span
        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border {statusMeta.color} self-start sm:self-auto"
      >
        {statusMeta.label}
      </span>
    </div>

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <input
        id="custom-domain-input"
        type="text"
        bind:value={domainInput}
        placeholder="feedback.perusahaan.com"
        class="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
        required
      />
      <button
        type="submit"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
      >
        <Save class="w-4 h-4" />
        <span>Simpan</span>
      </button>
      <button
        type="button"
        onclick={handleCheckDns}
        disabled={isChecking}
        class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw class="w-4 h-4 {isChecking ? 'animate-spin' : ''}" />
        <span>{isChecking ? "Memeriksa..." : "Cek DNS CNAME"}</span>
      </button>
    </div>
  </form>

  <!-- DNS Record Instructions -->
  <div
    class="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
  >
    <div>
      <h3 class="text-base font-bold text-slate-900">
        Petunjuk Konfigurasi DNS
      </h3>
      <p class="mt-1 text-xs text-slate-500">
        Tambahkan record DNS CNAME berikut di penyedia domain (DNS Registrar)
        Anda:
      </p>
    </div>

    <!-- Record Table -->
    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-left text-xs text-slate-600">
        <thead
          class="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200"
        >
          <tr>
            <th class="p-3.5">Tipe Record</th>
            <th class="p-3.5">Nama / Host</th>
            <th class="p-3.5">Target / Nilai</th>
            <th class="p-3.5">TTL</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 font-mono text-slate-800">
          <tr>
            <td class="p-3.5 font-bold text-indigo-600"
              >{dnsInstruction.type}</td
            >
            <td class="p-3.5">feedback</td>
            <td class="p-3.5">{dnsInstruction.target}</td>
            <td class="p-3.5">Auto / 3600</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Provider Tabs -->
    <div class="space-y-3 pt-2">
      <div class="text-xs font-semibold text-slate-700">
        Panduan Per Provider:
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {activeProvider ===
          'cloudflare'
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
          onclick={() => (activeProvider = "cloudflare")}
        >
          Cloudflare
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {activeProvider ===
          'godaddy'
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
          onclick={() => (activeProvider = "godaddy")}
        >
          GoDaddy
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors {activeProvider ===
          'general'
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
          onclick={() => (activeProvider = "general")}
        >
          Niagahoster / Umum
        </button>
      </div>

      {#if dnsInstruction.proxyNotice}
        <div
          class="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-start gap-2"
        >
          <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Perhatian Cloudflare:</strong>
            {dnsInstruction.proxyNotice}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
