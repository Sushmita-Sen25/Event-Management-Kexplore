import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: {
    port: 5173,
    // The API runs on :5000 locally; in production Vercel rewrites /api to Render (same origin → first-party cookie).
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
});
