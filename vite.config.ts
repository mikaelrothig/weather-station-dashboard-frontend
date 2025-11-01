import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index'),
        langebaan: resolve(__dirname, 'langebaan'),
        witsand: resolve(__dirname, 'witsand'),
        mistycliffs: resolve(__dirname, 'misty-cliffs'),
      },
    },
  },
})
