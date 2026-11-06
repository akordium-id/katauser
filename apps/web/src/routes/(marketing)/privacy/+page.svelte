<svelte:head>
  <title>Kebijakan Privasi - Katauser</title>
</svelte:head>

<div class="container mx-auto px-4 max-w-4xl py-16">
  <h1 class="text-3xl sm:text-4xl font-extrabold text-base-content mb-6">Kebijakan Privasi</h1>
  <p class="text-sm text-base-content/60 mb-8">Terakhir diperbarui: 6 November 2026</p>

  <div class="prose max-w-none text-base-content/80 space-y-6 text-sm sm:text-base leading-relaxed">
    <p>
      Katauser menghormati privasi Anda dan berkomitmen melindungi integritas data pengguna.
    </p>

    <h2 class="text-xl font-bold text-base-content">1. Pengumpulan Data</h2>
    <p>
      Pada model self-hosted, kami tidak mengumpulkan data telemetri, isi masukan feedback, data akun pengguna, maupun kredensial Anda. Seluruh data disimpan secara lokal di basis data PostgreSQL Anda sendiri.
    </p>

    <h2 class="text-xl font-bold text-base-content">2. Cookie Sesi</h2>
    <p>
      Katauser menggunakan cookie sesi native HttpOnly (`katauser_session`) semata-mata untuk mengidentifikasi status login pengguna. Kami tidak menggunakan cookie pelacak pihak ketiga atau iklan.
    </p>

    <h2 class="text-xl font-bold text-base-content">3. Keamanan Data</h2>
    <p>
      Katauser menerapkan zero-dependency scrypt hashing untuk penyimpanan kata sandi dan token sesi acak aman berukuran kriptografis tinggi.
    </p>
  </div>
</div>

