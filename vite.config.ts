import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { spots, type Spot } from './src/config/spots'

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const fillSpot = (html: string, spot: Spot) =>
  html.replaceAll('{{SPOT_NAME}}', escapeHtml(spot.name)).replaceAll('{{SPOT_REGION}}', escapeHtml(spot.region))

const spotAt = (url = '') => spots.find((spot) => spot.url === url.split('?')[0])

/**
 * One page per spot from one template (spot.html), so adding a spot to src/config/spots.ts is all it takes.
 * Each page gets its own title and description for search results and link previews; the app itself is one bundle
 * that reads the spot from the URL. Builds write /blouberg.html etc.; Vercel serves them at /blouberg (cleanUrls).
 */
const spotPages = (): Plugin => ({
  name: 'spot-pages',
  enforce: 'post',
  // Dev: serve the template at every spot URL, filled in for that spot
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && spotAt(req.url)) {
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
        req.url = `/spot.html${query}`
      }
      next()
    })
  },
  transformIndexHtml: {
    order: 'pre',
    handler: (html, { originalUrl }) => {
      const spot = spotAt(originalUrl)
      return spot ? fillSpot(html, spot) : html
    },
  },
  // Build: copy the built template once per spot, then drop it
  generateBundle(_options, bundle) {
    const template = bundle['spot.html']
    if (template?.type !== 'asset') throw new Error('spot-pages: spot.html missing from the build')
    for (const spot of spots) {
      this.emitFile({ type: 'asset', fileName: `${spot.url.slice(1)}.html`, source: fillSpot(String(template.source), spot) })
    }
    delete bundle['spot.html']
  },
})

/**
 * Pages don't paint until their entry script has run (blocking="render"), so the header is already there in the first
 * frame. Pages are blank until then anyway; it's what lets the header's pill slide between pages (index.css). Added
 * here because Vite drops the attribute when it rewrites the entry script tag.
 */
const renderBlockingEntry = (): Plugin => ({
  name: 'render-blocking-entry',
  transformIndexHtml: {
    order: 'post',
    handler: (html) => html.replace(/<script type="module"(?=[^>]*\ssrc="\/(?:src\/entries|assets)\/)/g, '<script type="module" blocking="render"'),
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spotPages(), renderBlockingEntry()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        spot: resolve(__dirname, 'spot.html'),
      },
    },
  },
})
