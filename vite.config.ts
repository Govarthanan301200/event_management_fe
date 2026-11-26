import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
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
