import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // Spec §14 as decided 2026-11-22: the "mobile app" is this web app installed on the phone,
    // with a service worker for offline and Web Push reminders (sw/sw.ts).
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'sw',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'prompt',
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      // On in dev too, so reminders can be tried locally (Chrome allows push on localhost).
      devOptions: { enabled: true, type: 'module', navigateFallback: 'index.html' },
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Wedding planner',
        short_name: 'Planner',
        description: 'Run the day: tasks, vendors and reminders for every function.',
        start_url: '/today',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf8f4', // surface (tokens.json)
        theme_color: '#faf8f4',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    env: { VITE_API_URL: 'http://api.test' },
    // The longest user-event flows (S8 drawer, task dialogs) take ~4-5s each while every file
    // runs in parallel on Windows; the 5s default made them fail under load, not on behaviour.
    testTimeout: 15_000,
  },
});
