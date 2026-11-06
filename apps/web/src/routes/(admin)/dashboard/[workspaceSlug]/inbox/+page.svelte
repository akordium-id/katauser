<script lang="ts">
  import { getConversationStatusBadge, filterConversations } from '$lib/inbox-helpers';

  let { data } = $props();

  let conversations = $state<any[]>([]);
  let activeFilter = $state<'all' | 'human' | 'ai'>('all');
  let selectedConvId = $state<string | null>(null);
  let replyText = $state('');

  $effect(() => {
    conversations = data.conversations || [];
    if (!selectedConvId && conversations.length > 0) {
      selectedConvId = conversations[0].id;
    }
  });

  const filteredConversations = $derived(
    filterConversations(conversations, activeFilter)
  );

  const activeConversation = $derived(
    conversations.find((c) => c.id === selectedConvId) || conversations[0]
  );

  let mockMessages = $state<Record<string, any[]>>({
    conv_demo_1: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Halo, saya butuh bantuan invoice tahunan enterprise.',
        time: '15 menit lalu',
      },
      {
        id: 'm2',
        sender: 'ai',
        text: 'Halo! Saya Juno. Saya telah mengalihkan percakapan ini ke tim support manusia kami.',
        time: '14 menit lalu',
      },
    ],
    conv_demo_2: [
      {
        id: 'm3',
        sender: 'user',
        text: 'Bagaimana cara menambahkan widget ke website Webflow?',
        time: '45 menit lalu',
      },
      {
        id: 'm4',
        sender: 'ai',
        text: 'Anda cukup menyalin script tag <script src="..." data-workspace="acme" async> ke bagian Custom Code Webflow sebelum tag </body>.',
        time: '44 menit lalu',
      },
    ],
    conv_demo_3: [
      {
        id: 'm5',
        sender: 'user',
        text: 'Terima kasih, masalah SSL custom domain sudah selesai.',
        time: 'Kemarin',
      },
    ],
  });

  function handleSendReply(e: SubmitEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    if (!mockMessages[selectedConvId]) {
      mockMessages[selectedConvId] = [];
    }

    mockMessages[selectedConvId].push({
      id: 'staff_' + Date.now(),
      sender: 'human',
      text: replyText.trim(),
      time: 'Baru saja',
    });

    replyText = '';
  }

  function handleResolve() {
    if (!activeConversation) return;
    activeConversation.status = 'closed';
  }
</script>

<svelte:head>
  <title>Inbox & Live Chat | Katauser Admin</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
  <!-- Top Navigation Bar -->
  <header class="border-b border-slate-200/80 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-20">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
        K
      </div>
      <div>
        <h1 class="text-base font-bold text-slate-900">Live Chat & Support Inbox</h1>
        <div class="text-xs text-slate-400">Workspace: {data.workspaceSlug}</div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <a
        href="/dashboard/{data.workspaceSlug}/boards"
        class="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
      >
        Boards
      </a>
      <a
        href="/dashboard/{data.workspaceSlug}/changelog/new"
        class="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
      >
        Buat Changelog
      </a>
    </div>
  </header>

  <!-- Split View Inbox Container -->
  <div class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
    <!-- Left Column: Conversations List -->
    <div class="rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-xs">
      <!-- Filter Bar -->
      <div class="p-3 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50/50">
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors {activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}"
          onclick={() => (activeFilter = 'all')}
        >
          Semua
        </button>
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors {activeFilter === 'human' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}"
          onclick={() => (activeFilter = 'human')}
        >
          Perlu Staf
        </button>
        <button
          type="button"
          class="rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors {activeFilter === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}"
          onclick={() => (activeFilter = 'ai')}
        >
          AI Juno
        </button>
      </div>

      <!-- Threads List -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100">
        {#if filteredConversations.length === 0}
          <div class="p-6 text-center text-xs text-slate-400">
            Tidak ada percakapan pada filter ini
          </div>
        {:else}
          {#each filteredConversations as conv (conv.id)}
            {@const badge = getConversationStatusBadge(conv.status, conv.assignedTo)}
            <div
              role="button"
              tabindex="0"
              onclick={() => (selectedConvId = conv.id)}
              onkeydown={(e) => e.key === 'Enter' && (selectedConvId = conv.id)}
              class="p-4 cursor-pointer transition-colors text-left {selectedConvId === conv.id ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'}"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-slate-900 truncate">
                  {conv.endUserId || 'Pengunjung Anonim'}
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border {badge.color}">
                  {badge.label}
                </span>
              </div>
              <p class="text-xs text-slate-500 line-clamp-2">
                {conv.lastMessage || 'Percakapan baru dimulai'}
              </p>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Right Column: Active Thread Detail -->
    <div class="md:col-span-2 rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-xs">
      {#if activeConversation}
        {@const badge = getConversationStatusBadge(activeConversation.status, activeConversation.assignedTo)}
        <!-- Thread Header -->
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-slate-900">
                {activeConversation.endUserId || 'Pengunjung Anonim'}
              </h3>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border {badge.color}">
                {badge.label}
              </span>
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">
              ID Percakapan: {activeConversation.id}
            </div>
          </div>

          {#if activeConversation.status !== 'closed'}
            <button
              type="button"
              onclick={handleResolve}
              class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              Tandai Selesai
            </button>
          {/if}
        </div>

        <!-- Messages Thread -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {#each (mockMessages[activeConversation.id] || []) as msg (msg.id)}
            <div class="flex flex-col {msg.sender === 'user' ? 'items-start' : 'items-end'}">
              <span class="text-[10px] font-semibold text-slate-400 mb-1">
                {msg.sender === 'user' ? 'Pengguna' : msg.sender === 'ai' ? 'AI Juno' : 'Staf Dukungan'}
              </span>
              <div class="max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed {msg.sender === 'user' ? 'bg-slate-100 text-slate-800 rounded-bl-xs' : msg.sender === 'ai' ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-br-xs' : 'bg-indigo-600 text-white rounded-br-xs'}">
                {msg.text}
              </div>
              <span class="text-[9px] text-slate-400 mt-1">{msg.time}</span>
            </div>
          {/each}
        </div>

        <!-- Reply Composer -->
        <form onsubmit={handleSendReply} class="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            bind:value={replyText}
            placeholder="Ketik balasan sebagai staf dukungan..."
            class="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
          >
            Kirim Balasan
          </button>
        </form>
      {:else}
        <div class="flex-1 flex items-center justify-center text-xs text-slate-400">
          Pilih percakapan di sebelah kiri untuk melihat pesan
        </div>
      {/if}
    </div>
  </div>
</div>

