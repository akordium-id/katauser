<script lang="ts">
  import type { PageData, ActionData } from './$types';

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  let slackUrl = $state('');
  let discordUrl = $state('');
  let testingStatus = $state<string | null>(null);

  $effect(() => {
    slackUrl = data.webhook?.slackWebhookUrl || '';
    discordUrl = data.webhook?.discordWebhookUrl || '';
  });

  async function handleTestWebhook() {
    testingStatus = 'Mengirim notifikasi pengujian...';
    try {
      const res = await fetch(`/api/v1/workspaces/${data.workspaceSlug}/integrations/webhook/test`, {
        method: 'POST',
      });
      if (res.ok) {
        testingStatus = '✅ Berhasil! Notifikasi terkirim ke webhook Anda.';
      } else {
        testingStatus = '⚠️ Webhook belum tersimpan atau URL tidak dapat dijangkau.';
      }
    } catch {
      testingStatus = '❌ Terjadi kesalahan jaringan saat mengirim tes.';
    }
  }
</script>

<svelte:head>
  <title>Integrations & Webhooks | Katauser</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-900">Integrasi Eksternal (Slack & Discord)</h1>
    <p class="text-sm text-gray-500 mt-1">
      Hubungkan workspace Katauser Anda dengan channel tim untuk menerima notifikasi real-time saat ada feedback baru, vote, atau percakapan eskalasi.
    </p>
  </div>

  {#if form?.error}
    <div class="alert alert-error mb-6">
      <span>{form.error}</span>
    </div>
  {/if}

  {#if form?.success}
    <div class="alert alert-success mb-6">
      <span>{form.message}</span>
    </div>
  {/if}

  <form method="POST" action="?/saveWebhook" class="space-y-6">
    <!-- Slack Section -->
    <div class="card bg-base-100 border border-gray-200 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
          #
        </div>
        <div>
          <h2 class="text-base font-semibold text-gray-900">Slack Incoming Webhook</h2>
          <p class="text-xs text-gray-500">Kirim kartu Block Kit interaktif ke channel Slack tim Anda.</p>
        </div>
      </div>

      <div class="form-control">
        <label for="slack-url" class="label">
          <span class="label-text font-medium">Webhook URL</span>
        </label>
        <input
          id="slack-url"
          name="slackWebhookUrl"
          type="url"
          bind:value={slackUrl}
          placeholder="https://hooks.slack.com/services/..."
          class="input input-bordered w-full text-sm font-mono"
        />
        <div class="label">
          <span class="label-text-alt text-gray-400">Buat webhook di menu Slack App Directory › Incoming WebHooks.</span>
        </div>
      </div>
    </div>

    <!-- Discord Section -->
    <div class="card bg-base-100 border border-gray-200 shadow-sm p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
          🎮
        </div>
        <div>
          <h2 class="text-base font-semibold text-gray-900">Discord Webhook</h2>
          <p class="text-xs text-gray-500">Kirim rich embeds ke text channel Discord komunitas atau internal.</p>
        </div>
      </div>

      <div class="form-control">
        <label for="discord-url" class="label">
          <span class="label-text font-medium">Webhook URL</span>
        </label>
        <input
          id="discord-url"
          name="discordWebhookUrl"
          type="url"
          bind:value={discordUrl}
          placeholder="https://discord.com/api/webhooks/..."
          class="input input-bordered w-full text-sm font-mono"
        />
        <div class="label">
          <span class="label-text-alt text-gray-400">Salin URL dari Channel Settings › Integrations › Webhooks.</span>
        </div>
      </div>
    </div>

    <!-- Event Triggers Info -->
    <div class="bg-gray-50 rounded-lg p-5 border border-gray-200">
      <h3 class="text-sm font-semibold text-gray-800 mb-3">Event yang otomatis dikirim:</h3>
      <ul class="space-y-2 text-xs text-gray-600">
        <li class="flex items-center gap-2">
          <span class="badge badge-xs badge-info"></span>
          <span><strong>post.created</strong> — Ide saran atau bug baru dikirim oleh customer.</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="badge badge-xs badge-success"></span>
          <span><strong>post.voted</strong> — Upvote baru masuk dengan informasi nilai MRR pemilih.</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="badge badge-xs badge-error"></span>
          <span><strong>chat.escalated</strong> — Customer meminta bantuan langsung manusia dari widget live chat.</span>
        </li>
      </ul>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4">
      <button
        type="button"
        onclick={handleTestWebhook}
        class="btn btn-outline btn-sm text-gray-700"
      >
        Kirim Tes Notifikasi
      </button>

      <button type="submit" class="btn btn-primary btn-sm px-6">
        Simpan Pengaturan
      </button>
    </div>

    {#if testingStatus}
      <div class="mt-3 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono">
        {testingStatus}
      </div>
    {/if}
  </form>
</div>

