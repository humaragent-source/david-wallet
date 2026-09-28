import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://humaragent-source.github.io/david-wallet/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/david-wallet/',
  build: { chunkSizeWarningLimit: 4000 },
});
