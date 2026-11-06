<script lang="ts">
  let copied = $state(false)

  const copyCommand = () => {
    navigator.clipboard?.writeText(
      "git clone https://github.com/akordium-id/katauser.git && cd katauser-app && docker compose -f docker/docker-compose.prod.yml up -d",
    )
    copied = true
    setTimeout(() => (copied = false), 2500)
  }
</script>

<section id="self-host" class="py-20 bg-base-200/50 border-t border-base-300">
  <div class="container mx-auto px-4 max-w-7xl">
    <div class="max-w-3xl mx-auto text-center mb-16">
      <div
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider mb-3"
      >
        Kemandirian Penuh & Open Source
      </div>
      <h2
        class="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight"
      >
        100% Self-Hosted di VPS Anda Sendiri
      </h2>
      <p class="mt-4 text-base sm:text-lg text-base-content/70 leading-relaxed">
        Tanpa vendor lock-in, tanpa batasan jumlah voter, dan tanpa biaya
        langganan bulanan mahal. Seluruh data pengguna tersimpan aman di
        infrastruktur Anda.
      </p>
    </div>

    <!-- Quick terminal command box -->
    <div class="max-w-2xl mx-auto mb-16">
      <div
        class="mockup-code bg-slate-950 text-slate-200 text-xs sm:text-sm shadow-xl border border-slate-800"
      >
        <div
          class="px-4 py-1 flex items-center justify-between border-b border-slate-800/80 mb-2"
        >
          <span class="text-slate-400 font-mono text-xs"
            >Deploy dengan 1 Perintah Terminal</span
          >
          <button
            onclick={copyCommand}
            class="btn btn-ghost btn-xs text-xs text-primary hover:bg-slate-800"
          >
            {copied ? "✓ Tersalin!" : "Salin Perintah"}
          </button>
        </div>
        <pre data-prefix="$"><code
            >git clone https://github.com/akordium-id/katauser.git</code
          ></pre>
        <pre data-prefix="$"><code>cd katauser-app</code></pre>
        <pre data-prefix="$"><code
            >docker compose -f docker/docker-compose.prod.yml up -d</code
          ></pre>
      </div>
    </div>

    <!-- Key self-host highlights -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div
        class="card bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm"
      >
        <div
          class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4"
        >
          🐘
        </div>
        <h3 class="font-bold text-lg text-base-content mb-2">
          PostgreSQL & Drizzle ORM
        </h3>
        <p class="text-sm text-base-content/70 leading-relaxed">
          Menggunakan database PostgreSQL standar dengan schema Drizzle teruji.
          Didukung ekstensi pgvector untuk pencarian semantik AI tanpa
          ketergantungan cloud vendor.
        </p>
      </div>

      <div
        class="card bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm"
      >
        <div
          class="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold text-xl mb-4"
        >
          ☁️
        </div>
        <h3 class="font-bold text-lg text-base-content mb-2">
          Coolify & Nixpacks Ready
        </h3>
        <p class="text-sm text-base-content/70 leading-relaxed">
          Dilengkapi panduan deploy resmi untuk Coolify. Cukup masukkan
          Dockerfile atau Docker Compose, sambungkan domain, dan aplikasi
          langsung aktif dengan SSL otomatis.
        </p>
      </div>

      <div
        class="card bg-base-100 p-6 rounded-2xl border border-base-300 shadow-sm"
      >
        <div
          class="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold text-xl mb-4"
        >
          🔒
        </div>
        <h3 class="font-bold text-lg text-base-content mb-2">
          Privasi & Kedaulatan Data
        </h3>
        <p class="text-sm text-base-content/70 leading-relaxed">
          Data feedback internal dan roadmap rahasia Anda tidak dikirim ke pihak
          ketiga. Sesuai untuk kepatuhan regulasi privasi data (GDPR /
          perbankan).
        </p>
      </div>
    </div>
  </div>
</section>
