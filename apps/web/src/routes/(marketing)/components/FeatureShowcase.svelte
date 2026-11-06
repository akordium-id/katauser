<script lang="ts">
  import { Lightbulb, Map, Zap, Check, ChevronUp } from "lucide-svelte"

  let activeTab = $state<"boards" | "roadmap" | "widget">("boards")
</script>

<section id="features" class="py-20 bg-base-100 border-t border-base-200">
  <div class="container mx-auto px-4 max-w-7xl">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
        Fitur Inti Platform
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
        Satu Tempat untuk Seluruh Siklus Feedback Produk
      </h2>
      <p class="mt-4 text-base sm:text-lg text-base-content/70 leading-relaxed">
        Dari pengumpulan masukan pengguna, kurasi prioritas di roadmap, hingga pengumuman changelog lewat widget in-app.
      </p>

      <!-- Tabs -->
      <div class="flex justify-center mt-8">
        <div class="tabs tabs-boxed bg-base-200/80 p-1 rounded-xl">
          <button
            class="tab text-sm font-semibold {activeTab === 'boards' ? 'tab-active !bg-primary !text-primary-content' : ''}"
            onclick={() => (activeTab = "boards")}
          >
            1. Feedback Boards
          </button>
          <button
            class="tab text-sm font-semibold {activeTab === 'roadmap' ? 'tab-active !bg-primary !text-primary-content' : ''}"
            onclick={() => (activeTab = "roadmap")}
          >
            2. Public Roadmap
          </button>
          <button
            class="tab text-sm font-semibold {activeTab === 'widget' ? 'tab-active !bg-primary !text-primary-content' : ''}"
            onclick={() => (activeTab = "widget")}
          >
            3. In-App Widget & Changelog
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 1: Feedback Boards -->
    {#if activeTab === "boards"}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="space-y-6">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            <Lightbulb class="w-5 h-5 text-primary" />
          </div>
          <h3 class="text-2xl sm:text-3xl font-bold text-base-content">
            Ketahui Keinginan Pengguna Tanpa Tenggelam di Chat Support
          </h3>
          <p class="text-base-content/70 leading-relaxed">
            Berikan wadah publik atau privat bagi customer untuk menyampaikan saran fitur. Mereka dapat melakukan upvote, meninggalkan komentar, dan mengikuti perkembangan status secara langsung.
          </p>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs mt-0.5 font-bold">
                <Check class="w-3.5 h-3.5 text-success" />
              </span>
              <div>
                <strong class="text-sm text-base-content font-semibold">Deteksi Duplikasi Otomatis (Juno AI):</strong>
                <p class="text-xs text-base-content/70">Mencegah tiket ganda dengan mencocokkan kemiripan semantik saat pengguna mulai mengetik.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs mt-0.5 font-bold">
                <Check class="w-3.5 h-3.5 text-success" />
              </span>
              <div>
                <strong class="text-sm text-base-content font-semibold">Voting Anonim atau Berotentikasi:</strong>
                <p class="text-xs text-base-content/70">Fleksibilitas voting tanpa hambatan registrasi atau dengan verifikasi email terdaftar.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs mt-0.5 font-bold">
                <Check class="w-3.5 h-3.5 text-success" />
              </span>
              <div>
                <strong class="text-sm text-base-content font-semibold">Kategori & Papan Fleksibel:</strong>
                <p class="text-xs text-base-content/70">Pisahkan papan masukan untuk Web, Mobile App, Bug Report, atau Integrasi.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-base-200/50 p-6 rounded-2xl border border-base-300">
          <div class="mockup-window border border-base-300 bg-base-100 shadow-md">
            <div class="p-6 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-base-200">
                <span class="font-bold text-sm">Papan Masukan: Mobile App</span>
                <span class="badge badge-primary badge-sm">18 Masukan Aktif</span>
              </div>
              <div class="p-3 bg-base-200/50 rounded-lg flex items-center justify-between">
                <div>
                  <h4 class="font-semibold text-sm">Mode Gelap (Dark Mode) Otomatis</h4>
                  <p class="text-xs text-base-content/60">Ikuti preferensi tema sistem operasi perangkat.</p>
                </div>
                <div class="badge badge-primary font-bold flex items-center gap-1">
                  <ChevronUp class="w-3.5 h-3.5" /> 89
                </div>
              </div>
              <div class="p-3 bg-base-200/50 rounded-lg flex items-center justify-between">
                <div>
                  <h4 class="font-semibold text-sm">Notifikasi Push Pengingat Tugas</h4>
                  <p class="text-xs text-base-content/60">Notifikasi saat batas waktu deadline mendekati 24 jam.</p>
                </div>
                <div class="badge badge-ghost font-bold flex items-center gap-1">
                  <ChevronUp class="w-3.5 h-3.5" /> 63
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tab 2: Public Roadmap -->
    {#if activeTab === "roadmap"}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="space-y-6">
          <div class="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold text-xl">
            <Map class="w-5 h-5 text-warning" />
          </div>
          <h3 class="text-2xl sm:text-3xl font-bold text-base-content">
            Roadmap Transparan yang Membangun Kepercayaan Pengguna
          </h3>
          <p class="text-base-content/70 leading-relaxed">
            Tunjukkan arah pengembangan produk Anda. Tampilan visual Kanban interaktif memungkinkan customer melihat apa yang sedang Anda kerjakan saat ini dan apa yang akan hadir berikutnya.
          </p>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs mt-0.5 font-bold">
                <Check class="w-3.5 h-3.5 text-success" />
              </span>
              <div>
                <strong class="text-sm text-base-content font-semibold">Sinkronisasi Otomatis dengan Feedback:</strong>
                <p class="text-xs text-base-content/70">Ubah status ide feedback, dan tiket langsung berpindah kolom di roadmap publik.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs mt-0.5 font-bold">
                <Check class="w-3.5 h-3.5 text-success" />
              </span>
              <div>
                <strong class="text-sm text-base-content font-semibold">Notifikasi Otomatis ke Voter:</strong>
                <p class="text-xs text-base-content/70">Saat fitur bergeser ke 'Completed', semua voter otomatis menerima email pemberitahuan.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-base-200/50 p-6 rounded-2xl border border-base-300">
          <div class="grid grid-cols-3 gap-3 text-xs">
            <div class="bg-base-100 p-3 rounded-xl border border-base-300">
              <div class="font-bold text-info mb-2 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-info"></span> Planned
              </div>
              <div class="p-2 bg-base-200/60 rounded-lg mb-2">OAuth Google</div>
              <div class="p-2 bg-base-200/60 rounded-lg">Webhooks API</div>
            </div>
            <div class="bg-base-100 p-3 rounded-xl border border-base-300">
              <div class="font-bold text-warning mb-2 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-warning"></span> In Progress
              </div>
              <div class="p-2 bg-base-200/60 rounded-lg mb-2">Audit Logs</div>
              <div class="p-2 bg-base-200/60 rounded-lg">Custom Domain</div>
            </div>
            <div class="bg-base-100 p-3 rounded-xl border border-base-300">
              <div class="font-bold text-success mb-2 flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-success"></span> Completed
              </div>
              <div class="p-2 bg-base-200/60 rounded-lg mb-2">Native Auth</div>
              <div class="p-2 bg-base-200/60 rounded-lg">Embed Widget</div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tab 3: In-App Widget & Changelog -->
    {#if activeTab === "widget"}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div class="space-y-6">
          <div class="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold text-xl">
            <Zap class="w-5 h-5 text-success" />
          </div>
          <h3 class="text-2xl sm:text-3xl font-bold text-base-content">
            Pasang Widget Langsung di Dalam Aplikasi Anda
          </h3>
          <p class="text-base-content/70 leading-relaxed">
            Pengguna tidak perlu meninggalkan website produk Anda untuk memberikan masukan atau membaca rilis fitur baru. Cukup sisipkan satu baris tag script.
          </p>
          <div class="mockup-code text-xs bg-slate-900 text-slate-200">
            <pre data-prefix="1"><code>&lt;!-- Pasang di web aplikasi Anda --&gt;</code></pre>
            <pre data-prefix="2"><code>&lt;script</code></pre>
            <pre data-prefix="3"><code>  src="https://katauser.com/widget.js"</code></pre>
            <pre data-prefix="4"><code>  data-workspace="acme"</code></pre>
            <pre data-prefix="5"><code>  defer&gt;&lt;/script&gt;</code></pre>
          </div>
        </div>

        <div class="bg-base-200/50 p-6 rounded-2xl border border-base-300 flex items-center justify-center min-h-[300px]">
          <div class="card w-80 bg-base-100 border border-base-300 shadow-xl rounded-2xl">
            <div class="p-4 border-b border-base-200 flex items-center justify-between">
              <span class="font-bold text-sm">Ada Saran Fitur?</span>
              <span class="badge badge-ghost badge-xs">Widget Preview</span>
            </div>
            <div class="p-4 space-y-3 text-xs">
              <input type="text" placeholder="Judul ide atau masukan..." class="input input-sm input-bordered w-full" readonly />
              <textarea placeholder="Jelaskan kebutuhan Anda..." class="textarea textarea-sm textarea-bordered w-full h-16" readonly></textarea>
              <button class="btn btn-primary btn-sm w-full">Kirim Masukan</button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>
