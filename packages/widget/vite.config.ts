import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        customElement: true,
      },
    }),
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'Katauser',
      formats: ['iife', 'es'],
      fileName: (format) => (format === 'iife' ? 'katauser.js' : 'katauser.esm.js'),
    },
    rollupOptions: {
      output: {
        extend: true,
        exports: 'named',
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
});

