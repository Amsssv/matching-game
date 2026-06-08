import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@ui':       fileURLToPath(new URL('./src/ui/ui', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/ui/features', import.meta.url)),
      '@widgets':  fileURLToPath(new URL('./src/ui/widgets', import.meta.url)),
      '@hooks':    fileURLToPath(new URL('./src/ui/hooks', import.meta.url)),
      '@state':    fileURLToPath(new URL('./src/state', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
