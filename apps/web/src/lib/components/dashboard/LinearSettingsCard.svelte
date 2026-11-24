<script lang="ts">
  import {
    CheckCircle2,
    Copy,
    Check,
    AlertTriangle,
    Layers,
    ExternalLink,
    Zap,
    Unlink,
    Send,
  } from "lucide-svelte"
  import { validateLinearApiKey } from "$lib/integrations-helpers"

  interface Props {
    workspaceSlug: string
    integration?: {
      connected: boolean
      organizationName?: string
      defaultTeamId?: string
    } | null
    webhookUrl?: string
  }

  let { workspaceSlug, integration = null, webhookUrl = "" }: Props = $props()

  let apiKey = $state("")
  let webhookSecret = $state("")
  let defaultTeamId = $state("")
  let availableTeams = $state<Array<{ id: string; name: string; key: string }>>(
    [],
  )
  let isSubmitting = $state(false)
  let isTesting = $state(false)
  let copied = $state(false)
  let statusMessage = $state<{
    type: "success" | "error" | "warning"
    text: string
  } | null>(null)

  $effect(() => {
    if (integration?.defaultTeamId) {
      defaultTeamId = integration.defaultTeamId
    }
  })

  const defaultWebhookUrl = $derived(
    webhookUrl ||
      `https://katauser.com/api/v1/integrations/linear/webhook/${workspaceSlug}`,
  )

  async function handleCopyWebhook() {
    try {
      await navigator.clipboard.writeText(defaultWebhookUrl)
      copied = true
      setTimeout(() => {
        copied = false
      }, 2000)
    } catch {
      copied = false
    }
  }

  async function handleTestConnection() {
    const check = validateLinearApiKey(apiKey)
    if (!check.valid) {
      statusMessage = {
        type: "error",
        text: check.error || "API Key tidak valid",
      }
      return
    }

    isTesting = true
    statusMessage = null

    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/integrations/linear/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: apiKey.trim() }),
        },
      )

      const data = await res.json()
      if (res.ok && data.success) {
        availableTeams = data.teams || []
        if (availableTeams.length > 0 && !defaultTeamId) {
          defaultTeamId = availableTeams[0].id
        }
        statusMessage = {
          type: "success",
          text: `Koneksi berhasil! Terhubung ke ${data.organizationName || "Linear"} dengan ${availableTeams.length} tim ditemukan.`,
        }
      } else {
        statusMessage = {
          type: "error",
          text: data.message || "Gagal menguji koneksi Linear",
        }
      }
    } catch {
      statusMessage = {
        type: "error",
        text: "Terjadi kesalahan saat menguji koneksi",
      }
    } finally {
      isTesting = false
    }
  }

  async function handleConnectLinear() {
    const check = validateLinearApiKey(apiKey)
    if (!check.valid) {
      statusMessage = {
        type: "error",
        text: check.error || "API Key tidak valid",
      }
      return
    }

    if (!webhookSecret.trim()) {
      statusMessage = {
        type: "error",
        text: "Webhook Signing Secret wajib diisi untuk keamanan verifikasi",
      }
      return
    }

    isSubmitting = true
    statusMessage = null

    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/integrations/linear`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
            webhookSecret: webhookSecret.trim(),
            defaultTeamId: defaultTeamId || undefined,
          }),
        },
      )

      const data = await res.json()
      if (res.ok && data.success) {
        statusMessage = {
          type: "success",
          text: `Berhasil terhubung ke Linear (${data.integration?.organizationName || "Workspace"})!`,
        }
        window.location.reload()
      } else {
        statusMessage = {
          type: "error",
          text:
            data.message ||
            "Gagal menghubungkan Linear. Periksa kembali API Key.",
        }
      }
    } catch {
      statusMessage = {
        type: "error",
        text: "Terjadi kesalahan koneksi saat menghubungkan Linear",
      }
    } finally {
      isSubmitting = false
    }
  }

  async function handleDisconnectLinear() {
    if (!confirm("Apakah Anda yakin ingin memutuskan integrasi Linear?")) {
      return
    }

    try {
      const res = await fetch(
        `/api/v1/workspaces/${workspaceSlug}/integrations/linear`,
        {
          method: "DELETE",
        },
      )

      if (res.ok) {
        window.location.reload()
      }
    } catch {
      statusMessage = {
        type: "error",
        text: "Gagal memutuskan integrasi Linear",
      }
    }
  }
</script>

<div
  class="card bg-base-100 border border-slate-200 shadow-sm rounded-2xl overflow-hidden"
>
  <div class="card-body p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600"
        >
          <Layers class="w-5 h-5" />
        </div>
        <div>
          <h3
            class="text-base font-bold text-slate-900 flex items-center gap-2"
          >
            Linear Issue Tracker
            {#if integration?.connected}
              <span class="badge badge-sm badge-success gap-1 text-xs">
                <CheckCircle2 class="w-3 h-3" /> Terhubung
              </span>
            {:else}
              <span class="badge badge-sm badge-ghost text-xs"
                >Belum Terhubung</span
              >
            {/if}
          </h3>
          <p class="text-xs text-slate-500">
            Sinkronisasi 2-arah: buat issue dari post feedback, dan saat issue
            Done di Linear, status post otomatis selesai.
          </p>
        </div>
      </div>

      {#if integration?.connected}
        <button
          type="button"
          onclick={handleDisconnectLinear}
          class="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 gap-1"
        >
          <Unlink class="w-3.5 h-3.5" /> Putuskan
        </button>
      {/if}
    </div>

    <!-- Connected Info Banner -->
    {#if integration?.connected}
      <div
        class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-xs text-emerald-900"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Terhubung ke organisasi: <strong
              >{integration.organizationName || "Linear Organization"}</strong
            >
          </span>
        </div>
        <a
          href="https://linear.app"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
        >
          Buka Linear <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    {:else}
      <!-- Setup Form (when disconnected) -->
      <div class="space-y-4 pt-2">
        <div class="form-control">
          <label for="linear-api-key" class="label py-1">
            <span class="label-text text-xs font-semibold text-slate-700">
              Linear Personal API Key
            </span>
            <a
              href="https://linear.app/settings/api"
              target="_blank"
              rel="noreferrer"
              class="label-text-alt text-xs text-indigo-600 hover:underline flex items-center gap-1"
            >
              Buat API Key di Linear <ExternalLink class="w-3 h-3" />
            </a>
          </label>
          <div class="flex gap-2">
            <input
              id="linear-api-key"
              type="password"
              bind:value={apiKey}
              placeholder="lin_api_..."
              class="input input-sm input-bordered flex-1 font-mono text-xs rounded-lg"
            />
            <button
              type="button"
              onclick={handleTestConnection}
              disabled={isTesting}
              class="btn btn-outline btn-sm text-xs gap-1"
            >
              {#if isTesting}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <Send class="w-3 h-3" />
              {/if}
              <span>Uji Koneksi</span>
            </button>
          </div>
        </div>

        {#if availableTeams.length > 0}
          <div class="form-control">
            <label for="linear-default-team" class="label py-1">
              <span class="label-text text-xs font-semibold text-slate-700">
                Default Team Tujuan
              </span>
            </label>
            <select
              id="linear-default-team"
              bind:value={defaultTeamId}
              class="select select-sm select-bordered w-full rounded-lg text-xs"
            >
              {#each availableTeams as team (team.id)}
                <option value={team.id}>{team.name} ({team.key})</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="form-control">
          <label for="linear-webhook-secret" class="label py-1">
            <span class="label-text text-xs font-semibold text-slate-700">
              Webhook Signing Secret
            </span>
            <span class="label-text-alt text-xs text-slate-400">
              Dari pengaturan Webhook Linear
            </span>
          </label>
          <input
            id="linear-webhook-secret"
            type="password"
            bind:value={webhookSecret}
            placeholder="whsec_..."
            class="input input-sm input-bordered w-full font-mono text-xs rounded-lg"
          />
        </div>
      </div>
    {/if}

    <!-- Inbound Webhook Instructions -->
    <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
      <div class="flex items-center justify-between">
        <span
          class="text-xs font-bold text-slate-700 flex items-center gap-1.5"
        >
          <Zap class="w-3.5 h-3.5 text-amber-500" /> URL Inbound Webhook Katauser
        </span>
        <button
          type="button"
          onclick={handleCopyWebhook}
          class="btn btn-ghost btn-xs text-xs gap-1 text-slate-600 hover:text-slate-900"
        >
          {#if copied}
            <Check class="w-3.5 h-3.5 text-emerald-600" />
            <span class="text-emerald-600">Tersalin!</span>
          {:else}
            <Copy class="w-3.5 h-3.5" />
            <span>Salin URL</span>
          {/if}
        </button>
      </div>

      <div
        class="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-700 select-all overflow-x-auto"
      >
        {defaultWebhookUrl}
      </div>

      <p class="text-[11px] text-slate-500 leading-relaxed">
        Buka <em>Linear Settings → API → Webhooks</em>, klik
        <strong>New Webhook</strong>, tempel URL di atas, dan centang event
        <strong>Issues</strong>. Salin <em>Signing Secret</em> yang digenerate oleh
        Linear ke input di atas.
      </p>
    </div>

    <!-- Status Alert -->
    {#if statusMessage}
      <div
        class="alert text-xs py-2.5 rounded-xl {statusMessage.type === 'success'
          ? 'alert-success'
          : statusMessage.type === 'error'
            ? 'alert-error'
            : 'alert-warning'}"
      >
        {#if statusMessage.type === "success"}
          <CheckCircle2 class="w-4 h-4" />
        {:else if statusMessage.type === "error"}
          <AlertTriangle class="w-4 h-4" />
        {/if}
        <span>{statusMessage.text}</span>
      </div>
    {/if}

    <!-- Connect Action Button -->
    {#if !integration?.connected}
      <div class="flex justify-end pt-2">
        <button
          type="button"
          onclick={handleConnectLinear}
          disabled={isSubmitting}
          class="btn btn-primary btn-sm px-6 gap-2"
        >
          {#if isSubmitting}
            <span class="loading loading-spinner loading-xs"></span>
            <span>Menghubungkan...</span>
          {:else}
            <Zap class="w-3.5 h-3.5" />
            <span>Hubungkan Linear</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>
