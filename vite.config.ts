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
        hermanus: resolve(__dirname, 'hermanus.html'),
        langebaan: resolve(__dirname, 'langebaan.html'),
        mistycliffs: resolve(__dirname, 'misty-cliffs.html'),
        witsand: resolve(__dirname, 'witsand.html'),
        wijkaanzee: resolve(__dirname, 'wijk-aan-zee.html'),
        ijmuiden: resolve(__dirname, 'ijmuiden.html'),
        zandvoort: resolve(__dirname, 'zandvoort.html'),
        noordwijk: resolve(__dirname, 'noordwijk.html'),
        scheveningen: resolve(__dirname, 'scheveningen.html'),
        brouwersdam: resolve(__dirname, 'brouwersdam.html'),
        domburg: resolve(__dirname, 'domburg.html'),
        workum: resolve(__dirname, 'workum.html'),
        mirns: resolve(__dirname, 'mirns.html'),
        makkum: resolve(__dirname, 'makkum.html'),
      },
    },
  },
})
