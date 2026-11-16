<script lang="ts">
  import { Sparkles } from "lucide-svelte"
</script>

<footer class="mt-auto border-t border-slate-200/80 bg-white/50 py-6 text-center text-xs text-slate-500">
  <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
    <div class="text-[11px] text-slate-400">
      Portal Komunitas & Masukan Produk
    </div>

    <a
      href="/"
      target="_blank"
      rel="noreferrer"
      class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 shadow-2xs hover:border-indigo-300 hover:text-indigo-600 transition-colors"
    >
      <Sparkles class="w-3 h-3 text-indigo-500" />
      <span>Didukung oleh <strong>Katauser</strong></span>
    </a>
  </div>
</footer>
