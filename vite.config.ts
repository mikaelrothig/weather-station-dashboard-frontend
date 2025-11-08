import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        langebaan: resolve(__dirname, 'langebaan.html'),
        witsand: resolve(__dirname, 'witsand.html'),
        mistycliffs: resolve(__dirname, 'misty-cliffs.html'),
      },
    },
  },
})
