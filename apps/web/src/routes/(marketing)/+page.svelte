<script lang="ts">
  import HeroDemo from "./components/HeroDemo.svelte"
  import FeatureShowcase from "./components/FeatureShowcase.svelte"
  import SelfHostGrid from "./components/SelfHostGrid.svelte"
  import ComparisonSection from "./components/ComparisonSection.svelte"
  import FaqSection from "./components/FaqSection.svelte"
  import { Check, ArrowDown } from "lucide-svelte"
</script>

<svelte:head>
  <title
    >Katauser - Open Source User Feedback, Product Roadmap & Changelog Platform</title
  >
  <meta
    name="description"
    content="Platform user feedback, public roadmap, dan in-app widget yang 100% self-hosted & open source. Alternatif mandiri untuk Canny dan UserJot tanpa vendor lock-in."
  />
</svelte:head>

<!-- Hero Section -->
<section class="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
  <!-- Subtle background glow -->
  <div
    class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10"
  ></div>

  <div class="container mx-auto px-4 max-w-7xl">
    <div class="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
      <!-- Tagline pill -->
      <div
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-200 border border-base-300 text-xs sm:text-sm font-medium text-base-content/80 mb-6 shadow-xs"
      >
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span>Alternatif Open Source untuk Canny & UserJot</span>
        <span class="text-base-content/30">•</span>
        <a href="#self-host" class="text-primary hover:underline font-semibold"
          >100% Self-Hosted</a
        >
      </div>

      <!-- Main Heading -->
      <h1
        class="text-4xl sm:text-5xl lg:text-6xl font-black text-base-content tracking-tight leading-[1.15]"
      >
        Kumpulkan Feedback Pengguna.<br />
        <span
          class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"
        >
          100% di Server Anda Sendiri.
        </span>
      </h1>

      <!-- Subtitle -->
      <p
        class="mt-6 text-lg sm:text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed"
      >
        Papan saran (boards), roadmap publik, changelog rilis, dan in-app widget
        yang ringan. Tanpa batasan jumlah voter, tanpa biaya langganan bulanan
        mahal.
      </p>

      <!-- CTA Buttons -->
      <div
        class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <a
          href="/login/sign_up"
          class="btn btn-primary btn-md sm:btn-lg font-bold px-8 shadow-md w-full sm:w-auto"
        >
          Mulai Gratis Sekarang
        </a>
        <a
          href="#demo"
          class="btn btn-outline btn-md sm:btn-lg font-semibold px-6 border-base-300 hover:border-primary w-full sm:w-auto inline-flex items-center gap-2"
        >
          <span>Lihat Live Demo</span>
          <ArrowDown class="w-4 h-4" />
        </a>
      </div>

      <!-- Trust highlights -->
      <div
        class="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-base-content/60 font-medium"
      >
        <div class="flex items-center gap-1.5">
          <Check class="w-4 h-4 text-success" />
          <span>Tanpa Vendor Lock-in</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Check class="w-4 h-4 text-success" />
          <span>Unlimited Voters & Posts</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Check class="w-4 h-4 text-success" />
          <span>Stack Ringan (Hono + Svelte 5)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Check class="w-4 h-4 text-success" />
          <span>Deploy Coolify / Docker Ready</span>
        </div>
      </div>
    </div>

    <!-- Live Demo Section in Hero -->
    <div id="demo" class="max-w-4xl mx-auto scroll-mt-24">
      <HeroDemo />
    </div>
  </div>
</section>

<!-- Product Pillars -->
<FeatureShowcase />

<!-- Self-Host Architecture & One-Command Deploy -->
<SelfHostGrid />

<!-- Comparison with Canny & Proprietary Tools -->
<ComparisonSection />

<!-- FAQ -->
<FaqSection />

<!-- Bottom CTA Banner -->
<section class="py-20 bg-primary text-primary-content relative overflow-hidden">
  <div class="container mx-auto px-4 max-w-5xl text-center relative z-10">
    <h2
      class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6"
    >
      Siap Membangun Produk yang Dicintai Pengguna?
    </h2>
    <p
      class="text-lg sm:text-xl text-primary-content/85 max-w-2xl mx-auto mb-8 leading-relaxed"
    >
      Dapatkan insight masukan nyata dari pengguna hari ini juga. Jalankan
      Katauser di VPS Anda dalam 5 menit, atau coba akun demo gratis.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a
        href="/login/sign_up"
        class="btn btn-lg bg-base-100 text-base-content hover:bg-base-200 border-none font-bold px-8 shadow-xl w-full sm:w-auto"
      >
        Daftar Akun Gratis
      </a>
      <a
        href="https://github.com/akordium-id/katauser"
        target="_blank"
        rel="noreferrer"
        class="btn btn-lg btn-outline text-primary-content border-primary-content/40 hover:bg-primary-focus w-full sm:w-auto"
      >
        Clone di GitHub
      </a>
    </div>
  </div>
</section>
