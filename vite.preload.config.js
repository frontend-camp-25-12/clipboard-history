import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist/preload',
    lib: {
      entry: 'preload.js',
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: 'preload.js'
      }
    }
  }
});
