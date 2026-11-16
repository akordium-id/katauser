<script lang="ts">
  import type { PageData, ActionData } from "./$types"
  import {
    Webhook,
    Hash,
    Gamepad2,
    Send,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Save,
  } from "lucide-svelte"

  interface Props {
    data: PageData
    form: ActionData
  }

  let { data, form }: Props = $props()

  let slackUrl = $state("")
  let discordUrl = $state("")
  let testingStatus = $state<{
    type: "loading" | "success" | "warning" | "error"
    message: string
  } | null>(null)

  $effect(() => {
    slackUrl = data.webhook?.slackWebhookUrl || ""
    discordUrl = data.webhook?.discordWebhookUrl || ""
  })

  async function handleTestWebhook() {
    testingStatus = {
      type: "loading",
      message: "Mengirim notifikasi pengujian...",
    }
    try {
      const res = await fetch(
        `/api/v1/workspaces/${data.workspaceSlug}/integrations/webhook/test`,
        {
          method: "POST",
        },
      )
      if (res.ok) {
        testingStatus = {
          type: "success",
          message: "Berhasil! Notifikasi terkirim ke webhook Anda.",
        }
      } else {
        testingStatus = {
          type: "warning",
          message: "Webhook belum tersimpan atau URL tidak dapat dijangkau.",
        }
      }
    } catch {
      testingStatus = {
        type: "error",
        message: "Terjadi kesalahan jaringan saat mengirim tes.",
      }
    }
  }
</script>

<svelte:head>
  <title>Integrations & Webhooks | Katauser Admin</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <!-- Header -->
  <div>
    <div class="flex items-center gap-2 mb-1">
      <Webhook class="w-5 h-5 text-indigo-600" />
      <h2 class="text-xl font-bold tracking-tight text-slate-900">
        Integrasi Eksternal (Slack & Discord)
      </h2>
    </div>
    <p class="text-sm text-slate-500">
      Hubungkan workspace Katauser Anda dengan channel tim untuk menerima
      notifikasi real-time saat ada feedback baru, vote, atau percakapan
      eskalasi.
    </p>
  </div>

  {#if form?.error}
    <div class="alert alert-error text-xs flex items-center gap-2">
      <XCircle class="w-4 h-4 shrink-0" />
      <span>{form.error}</span>
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success text-xs flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{form.message}</span>
    </div>
  {/if}

  <form method="POST" action="?/saveWebhook" class="space-y-6">
    <!-- Slack Section -->
    <div
      class="card bg-base-100 border border-slate-200 shadow-xs p-6 space-y-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg"
        >
          <Hash class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-slate-900">
            Slack Incoming Webhook
          </h3>
          <p class="text-xs text-slate-500">
            Kirim kartu Block Kit interaktif ke channel Slack tim Anda.
          </p>
        </div>
      </div>

      <div class="form-control">
        <label for="slack-url" class="label pb-1">
          <span class="label-text text-xs font-semibold text-slate-700"
            >Webhook URL</span
          >
        </label>
        <input
          id="slack-url"
          name="slackWebhookUrl"
          type="url"
          bind:value={slackUrl}
          placeholder="https://hooks.slack.com/services/..."
          class="input input-bordered w-full text-sm font-mono"
        />
        <div class="label pt-1">
          <span class="label-text-alt text-slate-400"
            >Buat webhook di menu Slack App Directory › Incoming WebHooks.</span
          >
        </div>
      </div>
    </div>

    <!-- Discord Section -->
    <div
      class="card bg-base-100 border border-slate-200 shadow-xs p-6 space-y-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg"
        >
          <Gamepad2 class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-slate-900">
            Discord Webhook
          </h3>
          <p class="text-xs text-slate-500">
            Kirim rich embeds ke text channel Discord komunitas atau internal.
          </p>
        </div>
      </div>

      <div class="form-control">
        <label for="discord-url" class="label pb-1">
          <span class="label-text text-xs font-semibold text-slate-700"
            >Webhook URL</span
          >
        </label>
        <input
          id="discord-url"
          name="discordWebhookUrl"
          type="url"
          bind:value={discordUrl}
          placeholder="https://discord.com/api/webhooks/..."
          class="input input-bordered w-full text-sm font-mono"
        />
        <div class="label pt-1">
          <span class="label-text-alt text-slate-400"
            >Salin URL dari Channel Settings › Integrations › Webhooks.</span
          >
        </div>
      </div>
    </div>

    <!-- Event Triggers Info -->
    <div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
      <h4
        class="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3"
      >
        Event yang otomatis dikirim:
      </h4>
      <ul class="space-y-2 text-xs text-slate-600">
        <li class="flex items-center gap-2">
          <span class="badge badge-xs badge-info"></span>
          <span
            ><strong>post.created</strong> — Ide saran atau bug baru dikirim oleh
            customer.</span
          >
        </li>
        <li class="flex items-center gap-2">
          <span class="badge badge-xs badge-success"></span>
          <span
            ><strong>post.voted</strong> — Upvote baru masuk dengan informasi nilai
            MRR pemilih.</span
          >
        </li>
        <li class="flex items-center gap-2">
          <span class="badge badge-xs badge-error"></span>
          <span
            ><strong>chat.escalated</strong> — Customer meminta bantuan langsung manusia
            dari widget live chat.</span
          >
        </li>
      </ul>
    </div>

    <!-- Actions -->
    <div
      class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2"
    >
      <button
        type="button"
        onclick={handleTestWebhook}
        class="inline-flex items-center justify-center gap-2 btn btn-outline btn-sm text-slate-700 hover:bg-slate-100"
      >
        <Send class="w-3.5 h-3.5" />
        <span>Kirim Tes Notifikasi</span>
      </button>

      <button
        type="submit"
        class="inline-flex items-center justify-center gap-2 btn btn-primary btn-sm px-6"
      >
        <Save class="w-3.5 h-3.5" />
        <span>Simpan Pengaturan</span>
      </button>
    </div>

    {#if testingStatus}
      <div
        class="rounded-xl border p-3.5 text-xs flex items-center gap-2 {testingStatus.type ===
        'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : testingStatus.type === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : testingStatus.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-slate-200 bg-slate-100 text-slate-700'}"
      >
        {#if testingStatus.type === "success"}
          <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600" />
        {:else if testingStatus.type === "warning"}
          <AlertTriangle class="w-4 h-4 shrink-0 text-amber-600" />
        {:else if testingStatus.type === "error"}
          <XCircle class="w-4 h-4 shrink-0 text-rose-600" />
        {/if}
        <span>{testingStatus.message}</span>
      </div>
    {/if}
  </form>
</div>
