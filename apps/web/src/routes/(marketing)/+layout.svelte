<script lang="ts">
  import { WebsiteName } from "./../../config"
  import "../../app.css"
  import { Rocket, ArrowRight } from "lucide-svelte"

  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()
</script>

<!-- Top announcement badge -->
<aside
  aria-label="Pengumuman"
  class="bg-primary/10 border-b border-primary/20 py-2 text-center text-xs sm:text-sm font-medium text-primary flex items-center justify-center gap-1.5 flex-wrap px-4"
>
  <Rocket class="w-3.5 h-3.5 shrink-0 inline" />
  <span
    >Katauser v1.0 kini 100% Open Source & Self-Hosted. Tanpa lock-in vendor!</span
  >
  <a
    href="https://github.com/akordium-id/katauser"
    target="_blank"
    rel="noreferrer"
    class="underline ml-1 hover:opacity-80 font-bold inline-flex items-center gap-1"
  >
    <span>Beri Bintang di GitHub</span>
    <ArrowRight class="w-3 h-3" />
  </a>
</aside>

<!-- Navbar -->
<header
  class="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-200"
>
  <div class="navbar container mx-auto px-4 max-w-7xl">
    <div class="navbar-start">
      <a
        class="flex items-center gap-2.5 font-black text-xl tracking-tight text-base-content hover:opacity-90"
        href="/"
      >
        <div
          class="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold text-lg shadow-sm"
        >
          K
        </div>
        <span>{WebsiteName}</span>
      </a>
    </div>

    <div class="navbar-center hidden lg:flex">
      <ul
        class="menu menu-horizontal px-1 gap-1 text-sm font-medium text-base-content/80"
      >
        <li><a href="/#features" class="hover:text-primary">Fitur</a></li>
        <li><a href="/#demo" class="hover:text-primary">Live Demo</a></li>
        <li><a href="/#self-host" class="hover:text-primary">Self-Host</a></li>
        <li><a href="/#comparison" class="hover:text-primary">Komparasi</a></li>
        <li><a href="/pricing" class="hover:text-primary">Pricing</a></li>
        <li><a href="/#faq" class="hover:text-primary">FAQ</a></li>
      </ul>
    </div>

    <div class="navbar-end gap-2">
      <a
        href="https://github.com/akordium-id/katauser"
        target="_blank"
        rel="noreferrer"
        class="btn btn-ghost btn-sm hidden sm:inline-flex items-center gap-1.5 border border-base-300"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
        <span>Star</span>
      </a>

      <a href="/login/sign_in" class="btn btn-ghost btn-sm font-semibold">
        Masuk
      </a>

      <a href="/login/sign_up" class="btn btn-primary btn-sm font-semibold">
        Mulai Gratis
      </a>

      <!-- Mobile dropdown -->
      <div class="dropdown dropdown-end lg:hidden">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <label
          tabindex="0"
          class="btn btn-ghost btn-circle btn-sm"
          aria-label="Menu navigasi"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </label>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <ul
          tabindex="0"
          class="menu menu-md dropdown-content mt-3 z-50 p-3 shadow-lg bg-base-100 rounded-box w-56 border border-base-200 gap-1 font-medium"
        >
          <li><a href="/#features">Fitur</a></li>
          <li><a href="/#demo">Live Demo</a></li>
          <li><a href="/#self-host">Self-Host</a></li>
          <li><a href="/#comparison">Komparasi</a></li>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/#faq">FAQ</a></li>
          <div class="divider my-1"></div>
          <li><a href="/login/sign_in">Masuk Akun</a></li>
          <li>
            <a href="/login/sign_up" class="text-primary font-bold"
              >Daftar Akun</a
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</header>

<!-- Main content container -->
<main class="min-h-[calc(100vh-280px)]">
  {@render children?.()}
</main>

<!-- Footer -->
<footer class="bg-base-200 border-t border-base-300 mt-24 text-base-content">
  <div class="container mx-auto px-4 max-w-7xl py-14">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
      <div class="lg:col-span-2">
        <div class="flex items-center gap-2.5 font-black text-xl mb-3">
          <div
            class="w-8 h-8 rounded-lg bg-primary text-primary-content flex items-center justify-center font-bold text-lg"
          >
            K
          </div>
          <span>Katauser</span>
        </div>
        <p class="text-sm text-base-content/70 max-w-sm mb-4 leading-relaxed">
          Platform open source untuk mengumpulkan feedback pengguna, mengelola
          public roadmap, merilis changelog, dan embed in-app widget. 100% data
          milik Anda sendiri.
        </p>
        <div class="flex items-center gap-3 text-xs text-base-content/60">
          <span class="badge badge-outline badge-sm">MIT / Apache 2.0</span>
          <span>•</span>
          <span
            >Dibuat oleh <a
              href="https://github.com/orin"
              target="_blank"
              rel="noreferrer"
              class="link link-hover font-semibold">Akordium Lab</a
            ></span
          >
        </div>
      </div>

      <div>
        <h4
          class="font-bold text-sm tracking-wider uppercase text-base-content/50 mb-3"
        >
          Produk
        </h4>
        <ul class="space-y-2 text-sm text-base-content/80">
          <li>
            <a href="/#features" class="hover:text-primary transition-colors"
              >Feedback Boards</a
            >
          </li>
          <li>
            <a href="/#features" class="hover:text-primary transition-colors"
              >Public Roadmap</a
            >
          </li>
          <li>
            <a href="/#features" class="hover:text-primary transition-colors"
              >Product Changelog</a
            >
          </li>
          <li>
            <a href="/#features" class="hover:text-primary transition-colors"
              >In-App Embed Widget</a
            >
          </li>
          <li>
            <a href="/pricing" class="hover:text-primary transition-colors"
              >Pricing & Cloud</a
            >
          </li>
        </ul>
      </div>

      <div>
        <h4
          class="font-bold text-sm tracking-wider uppercase text-base-content/50 mb-3"
        >
          Self-Hosting
        </h4>
        <ul class="space-y-2 text-sm text-base-content/80">
          <li>
            <a
              href="https://github.com/akordium-id/katauser/tree/main/@docs/deployment-coolify.md"
              target="_blank"
              rel="noreferrer"
              class="hover:text-primary transition-colors">Deploy ke Coolify</a
            >
          </li>
          <li>
            <a
              href="https://github.com/akordium-id/katauser/tree/main/docker"
              target="_blank"
              rel="noreferrer"
              class="hover:text-primary transition-colors">Docker Compose</a
            >
          </li>
          <li>
            <a
              href="https://github.com/akordium-id/katauser"
              target="_blank"
              rel="noreferrer"
              class="hover:text-primary transition-colors">GitHub Repository</a
            >
          </li>
          <li>
            <a
              href="https://github.com/akordium-id/katauser/releases"
              target="_blank"
              rel="noreferrer"
              class="hover:text-primary transition-colors">Release Notes</a
            >
          </li>
        </ul>
      </div>

      <div>
        <h4
          class="font-bold text-sm tracking-wider uppercase text-base-content/50 mb-3"
        >
          Dukungan
        </h4>
        <ul class="space-y-2 text-sm text-base-content/80">
          <li>
            <a href="/contact_us" class="hover:text-primary transition-colors"
              >Hubungi Kami</a
            >
          </li>
          <li>
            <a
              href="https://github.com/akordium-id/katauser/issues"
              target="_blank"
              rel="noreferrer"
              class="hover:text-primary transition-colors">Laporkan Bug</a
            >
          </li>
          <li>
            <a
              href="/login/sign_in"
              class="hover:text-primary transition-colors">Portal Dashboard</a
            >
          </li>
        </ul>
      </div>
    </div>

    <div class="divider my-8"></div>

    <div
      class="flex flex-col sm:flex-row justify-between items-center text-xs text-base-content/60 gap-4"
    >
      <div>© 2026 Katauser. Hak Cipta Dilindungi.</div>
      <div class="flex gap-6">
        <a href="/terms" class="hover:underline">Syarat & Ketentuan</a>
        <a href="/privacy" class="hover:underline">Kebijakan Privasi</a>
      </div>
    </div>
  </div>
</footer>
