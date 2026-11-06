<script lang="ts">
  const faqs = [
    {
      q: "Apa spesifikasi minimum server untuk menjalankan Katauser?",
      a: "Anda dapat menjalankan Katauser di VPS paling terjangkau (1 vCPU, 1 GB RAM, dan 10 GB Disk). Karena stack kami menggunakan backend Hono yang ringan dan SvelteKit SSR, footprint memorinya sangat hemat dibandingkan platform monolitik lainnya.",
    },
    {
      q: "Apakah saya bisa menghubungkan custom domain (misalnya feedback.brandku.com)?",
      a: "Ya! Katauser memiliki modul Domain Router bawaan. Anda cukup menambahkan CNAME record ke server Anda dan aplikasi akan otomatis memetakan tenant slug ke domain kustom tersebut.",
    },
    {
      q: "Bagaimana cara melakukan migrasi dari Supabase atau Canny?",
      a: "Katauser menggunakan PostgreSQL standar dengan skema Drizzle ORM. Anda dapat mengimpor data lewat query SQL biasa atau script migrasi JSON sederhana yang kami sediakan di folder dokumentasi.",
    },
    {
      q: "Apakah ada batasan jumlah voter atau posting masukan?",
      a: "Tidak ada batasan sama sekali pada versi Self-Host. Anda dapat mengumpulkan ribuan masukan dan ratusan ribu voting tanpa khawatir tagihan melonjak secara tiba-tiba.",
    },
    {
      q: "Kapan saya sebaiknya memilih versi Katauser Managed Cloud?",
      a: "Jika Anda atau tim Anda tidak ingin repot mengurus update server, instalasi pgvector, maintenance Redis, dan konfigurasi SMTP deliverability email, versi Cloud kami adalah pilihan tercepat dengan dukungan SLA 99.9%.",
    },
  ]
</script>

<section id="faq" class="py-20 bg-base-200/50 border-t border-base-300">
  <div class="container mx-auto px-4 max-w-4xl">
    <div class="text-center mb-16">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/10 text-info text-xs font-bold uppercase tracking-wider mb-3">
        Tanya Jawab
      </div>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
        Pertanyaan yang Sering Diajukan
      </h2>
      <p class="mt-4 text-base sm:text-lg text-base-content/70">
        Hal-hal penting seputar lisensi, deployment, dan integrasi teknis Katauser.
      </p>
    </div>

    <div class="space-y-4">
      {#each faqs as faq, i (i)}
        <div class="collapse collapse-plus bg-base-100 border border-base-300 rounded-xl shadow-xs">
          <input type="radio" name="landing-faq" checked={i === 0} />
          <div class="collapse-title text-base sm:text-lg font-bold text-base-content pr-12">
            {faq.q}
          </div>
          <div class="collapse-content text-sm sm:text-base text-base-content/70 leading-relaxed">
            <p>{faq.a}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

