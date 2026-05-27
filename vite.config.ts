import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'

/// <reference types="vitest" />
// https://vite.dev/config/
export default defineConfig({
  test: {
    include: ['server/**/*.test.js', 'src/**/*.test.ts'],
    environment: 'node',
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
