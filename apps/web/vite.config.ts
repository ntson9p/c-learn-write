import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { licensesPlugin } from './build/licenses.ts';
import { strokesPlugin } from './build/strokes.ts';

// Handwriting characters of the syllabus (HSK2: 100, HSK3: 150): only their stroke data ships.
const characters = JSON.parse(readFileSync(new URL('../../packages/course/data/hsk/characters.json', import.meta.url), 'utf8')) as {
  handwriting: Record<string, string[]>;
};
const handwriting = Object.values(characters.handwriting).flat();

// Static PWA: relative base and hash routes, so the build works from any
// sub-path (GitHub Pages) and offline.
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    // The service worker bundles these Workbox modules (vite-plugin-pwa, generateSW).
    licensesPlugin(['workbox-core', 'workbox-precaching', 'workbox-routing', 'workbox-strategies', 'hanzi-writer-data']),
    strokesPlugin(handwriting),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Học tiếng Trung HSK',
        short_name: 'Học HSK',
        description: 'Học từ vựng và ngữ pháp tiếng Trung HSK1–HSK3 bằng tiếng Việt. Chấm bài bằng luật, không dùng AI.',
        lang: 'vi',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fbf8f3',
        theme_color: '#b3261e',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,txt,TXT,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Take control of the first page load, so the app works offline right away.
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
